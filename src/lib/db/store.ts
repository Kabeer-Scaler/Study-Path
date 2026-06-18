import { mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { DatabaseSync } from "node:sqlite";
import {
  assessmentQuestions as seededAssessmentQuestions,
  concepts
} from "@/lib/db/seed";
import type {
  AssessmentAnswer,
  AssessmentQuestion,
  AssessmentSession,
  Curriculum,
  DataStore,
  LearnerMastery,
  LearningEvent,
  Lesson,
  MasteryEvidence,
  Module,
  QuizAttempt,
  ReviewSchedule,
  TutorMessage,
  User
} from "@/lib/types";

const dataDir = path.join(process.cwd(), ".data");
const dbFile = path.join(dataDir, "learnpath.sqlite");
let db: DatabaseSync | undefined;
let mutationQueue: Promise<unknown> = Promise.resolve();

export function makeId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\r\n/g, "\n")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ");
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function bool(value: unknown) {
  return Number(value) === 1;
}

function emptyStore(): DataStore {
  return {
    users: [],
    concepts,
    assessmentQuestions: [],
    assessmentSessions: [],
    assessmentAnswers: [],
    learnerMastery: [],
    curricula: [],
    modules: [],
    lessons: [],
    quizAttempts: [],
    tutorMessages: [],
    learningEvents: [],
    masteryEvidence: [],
    reviewSchedule: []
  };
}

async function openDb() {
  if (db) return db;
  await mkdir(dataDir, { recursive: true });
  db = new DatabaseSync(dbFile);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  initializeSchema(db);
  seedConcepts(db);
  return db;
}

function initializeSchema(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      password_hash TEXT,
      session_token TEXT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      goal TEXT,
      self_rated_level TEXT,
      preferred_style TEXT,
      daily_time_minutes INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS concepts (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      difficulty INTEGER,
      prerequisites TEXT
    );

    CREATE TABLE IF NOT EXISTS assessment_questions (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      question TEXT NOT NULL,
      type TEXT NOT NULL,
      options TEXT,
      correct_answer TEXT NOT NULL,
      accepted_answers TEXT,
      explanation TEXT,
      difficulty INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessment_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      current_question_id TEXT,
      asked_question_ids TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessment_answers (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      question TEXT NOT NULL,
      user_answer TEXT,
      correct_answer TEXT,
      is_correct INTEGER NOT NULL,
      explanation TEXT,
      misconception TEXT,
      difficulty INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learner_mastery (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      mastery_score REAL NOT NULL,
      confidence REAL NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, concept_id)
    );

    CREATE TABLE IF NOT EXISTS curricula (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      title TEXT NOT NULL,
      generated_reason TEXT,
      version INTEGER NOT NULL,
      change_reason TEXT,
      is_latest INTEGER NOT NULL,
      parent_curriculum_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      curriculum_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reason TEXT,
      order_index INTEGER,
      target_concepts TEXT
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      estimated_minutes INTEGER,
      order_index INTEGER,
      status TEXT NOT NULL,
      mastery_target REAL,
      why_assigned TEXT,
      why_skipped TEXT,
      is_remedial INTEGER NOT NULL,
      is_challenge INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      score REAL NOT NULL,
      total_questions INTEGER,
      correct_answers INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tutor_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT,
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      tutor_strategy TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mastery_evidence (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      previous_mastery REAL NOT NULL,
      new_mastery REAL NOT NULL,
      previous_confidence REAL NOT NULL,
      new_confidence REAL NOT NULL,
      reason TEXT NOT NULL,
      source TEXT NOT NULL,
      source_id TEXT,
      misconception TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_schedule (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      due_after_completed_lessons INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  const userColumns = database
    .prepare("PRAGMA table_info(users)")
    .all() as Array<{ name: string }>;
  const userColumnNames = new Set(userColumns.map((column) => column.name));
  if (!userColumnNames.has("email")) {
    database.exec("ALTER TABLE users ADD COLUMN email TEXT;");
  }
  if (!userColumnNames.has("password_hash")) {
    database.exec("ALTER TABLE users ADD COLUMN password_hash TEXT;");
  }
  if (!userColumnNames.has("session_token")) {
    database.exec("ALTER TABLE users ADD COLUMN session_token TEXT;");
  }
}

function seedConcepts(database: DatabaseSync) {
  const insertConcept = database.prepare(`
    INSERT OR REPLACE INTO concepts
      (id, subject, name, description, difficulty, prerequisites)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const concept of concepts) {
    insertConcept.run(
      concept.id,
      concept.subject,
      concept.name,
      concept.description,
      concept.difficulty,
      JSON.stringify(concept.prerequisites)
    );
  }

  const existingQuestions = database
    .prepare("SELECT COUNT(*) AS count FROM assessment_questions WHERE subject = ?")
    .get(concepts[0]?.subject ?? "") as { count: number };
  if (existingQuestions.count > 0) return;

  const insertQuestion = database.prepare(`
    INSERT OR REPLACE INTO assessment_questions
      (id, subject, concept_id, question, type, options, correct_answer, accepted_answers, explanation, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const question of seededAssessmentQuestions) {
    const concept = concepts.find((item) => item.id === question.conceptId);
    insertQuestion.run(
      question.id,
      concept?.subject ?? concepts[0]?.subject ?? "General",
      question.conceptId,
      question.question,
      question.type,
      JSON.stringify(question.options ?? []),
      question.correctAnswer,
      JSON.stringify(question.acceptedAnswers ?? []),
      question.explanation,
      question.difficulty
    );
  }
}

function readAll<T>(database: DatabaseSync, sql: string) {
  return database.prepare(sql).all() as Record<string, unknown>[] as T[];
}

export async function readStore(): Promise<DataStore> {
  const database = await openDb();
  return {
    ...emptyStore(),
    users: readAll<Record<string, unknown>>(database, "SELECT * FROM users").map(
      (row): User => ({
        id: String(row.id),
        email: String(row.email ?? ""),
        passwordHash: String(row.password_hash ?? ""),
        sessionToken: row.session_token ? String(row.session_token) : undefined,
        name: String(row.name),
        subject: String(row.subject),
        goal: String(row.goal ?? ""),
        selfRatedLevel: String(row.self_rated_level ?? ""),
        preferredStyle: String(row.preferred_style ?? ""),
        dailyTimeMinutes: Number(row.daily_time_minutes ?? 30),
        createdAt: String(row.created_at)
      })
    ),
    concepts: readAll<Record<string, unknown>>(database, "SELECT * FROM concepts").map(
      (row) => ({
        id: String(row.id),
        subject: String(row.subject),
        name: String(row.name),
        description: String(row.description ?? ""),
        difficulty: Number(row.difficulty ?? 1) as 1 | 2 | 3,
        prerequisites: parseJson(String(row.prerequisites ?? "[]"), [])
      })
    ),
    assessmentQuestions: readAll<Record<string, unknown>>(
      database,
      "SELECT * FROM assessment_questions"
    ).map(
      (row): AssessmentQuestion => ({
        id: String(row.id),
        conceptId: String(row.concept_id),
        question: String(row.question),
        type: String(row.type) as AssessmentQuestion["type"],
        options: parseJson(String(row.options ?? "[]"), []),
        correctAnswer: String(row.correct_answer),
        acceptedAnswers: parseJson(String(row.accepted_answers ?? "[]"), []),
        explanation: String(row.explanation ?? ""),
        difficulty: Number(row.difficulty) as 1 | 2 | 3
      })
    ),
    assessmentSessions: readAll<Record<string, unknown>>(
      database,
      "SELECT * FROM assessment_sessions"
    ).map(
      (row): AssessmentSession => ({
        id: String(row.id),
        userId: String(row.user_id),
        subject: String(row.subject),
        status: row.status === "completed" ? "completed" : "in_progress",
        startedAt: String(row.started_at),
        completedAt: row.completed_at ? String(row.completed_at) : undefined,
        currentQuestionId: row.current_question_id
          ? String(row.current_question_id)
          : undefined,
        askedQuestionIds: parseJson(String(row.asked_question_ids), [])
      })
    ),
    assessmentAnswers: readAll<Record<string, unknown>>(
      database,
      "SELECT * FROM assessment_answers"
    ).map(
      (row): AssessmentAnswer => ({
        id: String(row.id),
        sessionId: String(row.session_id),
        conceptId: String(row.concept_id),
        questionId: String(row.question_id),
        question: String(row.question),
        userAnswer: String(row.user_answer ?? ""),
        correctAnswer: String(row.correct_answer ?? ""),
        isCorrect: bool(row.is_correct),
        explanation: String(row.explanation ?? ""),
        misconception: row.misconception ? String(row.misconception) : undefined,
        difficulty: Number(row.difficulty) as 1 | 2 | 3,
        createdAt: String(row.created_at)
      })
    ),
    learnerMastery: readAll<Record<string, unknown>>(
      database,
      "SELECT * FROM learner_mastery"
    ).map(
      (row): LearnerMastery => ({
        id: String(row.id),
        userId: String(row.user_id),
        conceptId: String(row.concept_id),
        masteryScore: Number(row.mastery_score),
        confidence: Number(row.confidence),
        updatedAt: String(row.updated_at)
      })
    ),
    curricula: readAll<Record<string, unknown>>(database, "SELECT * FROM curricula").map(
      (row): Curriculum => ({
        id: String(row.id),
        userId: String(row.user_id),
        subject: String(row.subject),
        title: String(row.title),
        generatedReason: String(row.generated_reason ?? ""),
        version: Number(row.version ?? 1),
        changeReason: String(row.change_reason ?? ""),
        isLatest: bool(row.is_latest),
        parentCurriculumId: row.parent_curriculum_id
          ? String(row.parent_curriculum_id)
          : undefined,
        createdAt: String(row.created_at)
      })
    ),
    modules: readAll<Record<string, unknown>>(database, "SELECT * FROM modules").map(
      (row): Module => ({
        id: String(row.id),
        curriculumId: String(row.curriculum_id),
        title: String(row.title),
        description: String(row.description ?? ""),
        reason: String(row.reason ?? ""),
        orderIndex: Number(row.order_index ?? 0),
        targetConcepts: parseJson(String(row.target_concepts ?? "[]"), [])
      })
    ),
    lessons: readAll<Record<string, unknown>>(database, "SELECT * FROM lessons").map(
      (row): Lesson => ({
        id: String(row.id),
        moduleId: String(row.module_id),
        conceptId: String(row.concept_id),
        title: String(row.title),
        content: parseJson(String(row.content_json), {
          title: String(row.title),
          learningObjective: "",
          explanation: "",
          analogy: "",
          example: "",
          codeExample: "",
          commonMistake: "",
          practiceQuestion: { question: "", answer: "", hint: "" },
          quiz: []
        }),
        estimatedMinutes: Number(row.estimated_minutes ?? 20),
        orderIndex: Number(row.order_index ?? 0),
        status: String(row.status) as Lesson["status"],
        masteryTarget: Number(row.mastery_target ?? 0.8),
        whyAssigned: String(row.why_assigned ?? ""),
        whySkipped: row.why_skipped ? String(row.why_skipped) : undefined,
        isRemedial: bool(row.is_remedial),
        isChallenge: bool(row.is_challenge)
      })
    ),
    quizAttempts: readAll<Record<string, unknown>>(
      database,
      "SELECT * FROM quiz_attempts"
    ).map(
      (row): QuizAttempt => ({
        id: String(row.id),
        userId: String(row.user_id),
        lessonId: String(row.lesson_id),
        conceptId: String(row.concept_id),
        score: Number(row.score),
        totalQuestions: Number(row.total_questions ?? 0),
        correctAnswers: Number(row.correct_answers ?? 0),
        createdAt: String(row.created_at)
      })
    ),
    tutorMessages: readAll<Record<string, unknown>>(
      database,
      "SELECT * FROM tutor_messages"
    ).map(
      (row): TutorMessage => ({
        id: String(row.id),
        userId: String(row.user_id),
        lessonId: row.lesson_id ? String(row.lesson_id) : undefined,
        role: row.role === "assistant" ? "assistant" : "user",
        message: String(row.message),
        tutorStrategy: row.tutor_strategy
          ? (String(row.tutor_strategy) as TutorMessage["tutorStrategy"])
          : undefined,
        createdAt: String(row.created_at)
      })
    ),
    learningEvents: readAll<Record<string, unknown>>(
      database,
      "SELECT * FROM learning_events"
    ).map(
      (row): LearningEvent => ({
        id: String(row.id),
        userId: String(row.user_id),
        eventType: String(row.event_type),
        metadata: parseJson(String(row.metadata_json ?? "{}"), {}),
        createdAt: String(row.created_at)
      })
    ),
    masteryEvidence: readAll<Record<string, unknown>>(
      database,
      "SELECT * FROM mastery_evidence"
    ).map(
      (row): MasteryEvidence => ({
        id: String(row.id),
        userId: String(row.user_id),
        conceptId: String(row.concept_id),
        previousMastery: Number(row.previous_mastery),
        newMastery: Number(row.new_mastery),
        previousConfidence: Number(row.previous_confidence),
        newConfidence: Number(row.new_confidence),
        reason: String(row.reason),
        source: String(row.source) as MasteryEvidence["source"],
        sourceId: row.source_id ? String(row.source_id) : undefined,
        misconception: row.misconception ? String(row.misconception) : undefined,
        createdAt: String(row.created_at)
      })
    ),
    reviewSchedule: readAll<Record<string, unknown>>(
      database,
      "SELECT * FROM review_schedule"
    ).map(
      (row): ReviewSchedule => ({
        id: String(row.id),
        userId: String(row.user_id),
        conceptId: String(row.concept_id),
        reason: String(row.reason),
        dueAfterCompletedLessons: Number(row.due_after_completed_lessons),
        status: String(row.status) as ReviewSchedule["status"],
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at)
      })
    )
  };
}

function writeStoreToDb(database: DatabaseSync, store: DataStore) {
  database.exec("BEGIN IMMEDIATE TRANSACTION;");
  try {
    for (const table of [
      "users",
      "assessment_sessions",
      "assessment_answers",
      "learner_mastery",
      "curricula",
      "modules",
      "lessons",
      "quiz_attempts",
      "tutor_messages",
      "learning_events",
      "assessment_questions",
      "concepts",
      "mastery_evidence",
      "review_schedule"
    ]) {
      database.exec(`DELETE FROM ${table};`);
    }

    const conceptInsert = database.prepare(`
      INSERT INTO concepts
        (id, subject, name, description, difficulty, prerequisites)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.concepts) {
      conceptInsert.run(
        item.id,
        item.subject,
        item.name,
        item.description,
        item.difficulty,
        JSON.stringify(item.prerequisites)
      );
    }

    const questionInsert = database.prepare(`
      INSERT INTO assessment_questions
        (id, subject, concept_id, question, type, options, correct_answer, accepted_answers, explanation, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.assessmentQuestions) {
      const concept = store.concepts.find((conceptItem) => conceptItem.id === item.conceptId);
      questionInsert.run(
        item.id,
        concept?.subject ?? "General",
        item.conceptId,
        item.question,
        item.type,
        JSON.stringify(item.options ?? []),
        item.correctAnswer,
        JSON.stringify(item.acceptedAnswers ?? []),
        item.explanation,
        item.difficulty
      );
    }

    const users = database.prepare(`
      INSERT INTO users
        (id, email, password_hash, session_token, name, subject, goal, self_rated_level, preferred_style, daily_time_minutes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.users) {
      users.run(
        item.id,
        item.email,
        item.passwordHash,
        item.sessionToken ?? null,
        item.name,
        item.subject,
        item.goal,
        item.selfRatedLevel,
        item.preferredStyle,
        item.dailyTimeMinutes,
        item.createdAt
      );
    }

    const sessions = database.prepare(`
      INSERT INTO assessment_sessions
        (id, user_id, subject, status, started_at, completed_at, current_question_id, asked_question_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.assessmentSessions) {
      sessions.run(
        item.id,
        item.userId,
        item.subject,
        item.status,
        item.startedAt,
        item.completedAt ?? null,
        item.currentQuestionId ?? null,
        JSON.stringify(item.askedQuestionIds)
      );
    }

    const answers = database.prepare(`
      INSERT INTO assessment_answers
        (id, session_id, concept_id, question_id, question, user_answer, correct_answer, is_correct, explanation, misconception, difficulty, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.assessmentAnswers) {
      answers.run(
        item.id,
        item.sessionId,
        item.conceptId,
        item.questionId,
        item.question,
        item.userAnswer,
        item.correctAnswer,
        item.isCorrect ? 1 : 0,
        item.explanation,
        item.misconception ?? null,
        item.difficulty,
        item.createdAt
      );
    }

    const mastery = database.prepare(`
      INSERT INTO learner_mastery
        (id, user_id, concept_id, mastery_score, confidence, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.learnerMastery) {
      mastery.run(
        item.id,
        item.userId,
        item.conceptId,
        item.masteryScore,
        item.confidence,
        item.updatedAt
      );
    }

    const curricula = database.prepare(`
      INSERT INTO curricula
        (id, user_id, subject, title, generated_reason, version, change_reason, is_latest, parent_curriculum_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.curricula) {
      curricula.run(
        item.id,
        item.userId,
        item.subject,
        item.title,
        item.generatedReason,
        item.version,
        item.changeReason,
        item.isLatest ? 1 : 0,
        item.parentCurriculumId ?? null,
        item.createdAt
      );
    }

    const modules = database.prepare(`
      INSERT INTO modules
        (id, curriculum_id, title, description, reason, order_index, target_concepts)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.modules) {
      modules.run(
        item.id,
        item.curriculumId,
        item.title,
        item.description,
        item.reason,
        item.orderIndex,
        JSON.stringify(item.targetConcepts)
      );
    }

    const lessons = database.prepare(`
      INSERT INTO lessons
        (id, module_id, concept_id, title, content_json, estimated_minutes, order_index, status, mastery_target, why_assigned, why_skipped, is_remedial, is_challenge)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.lessons) {
      lessons.run(
        item.id,
        item.moduleId,
        item.conceptId,
        item.title,
        JSON.stringify(item.content),
        item.estimatedMinutes,
        item.orderIndex,
        item.status,
        item.masteryTarget,
        item.whyAssigned,
        item.whySkipped ?? null,
        item.isRemedial ? 1 : 0,
        item.isChallenge ? 1 : 0
      );
    }

    const quizAttempts = database.prepare(`
      INSERT INTO quiz_attempts
        (id, user_id, lesson_id, concept_id, score, total_questions, correct_answers, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.quizAttempts) {
      quizAttempts.run(
        item.id,
        item.userId,
        item.lessonId,
        item.conceptId,
        item.score,
        item.totalQuestions,
        item.correctAnswers,
        item.createdAt
      );
    }

    const tutorMessages = database.prepare(`
      INSERT INTO tutor_messages
        (id, user_id, lesson_id, role, message, tutor_strategy, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.tutorMessages) {
      tutorMessages.run(
        item.id,
        item.userId,
        item.lessonId ?? null,
        item.role,
        item.message,
        item.tutorStrategy ?? null,
        item.createdAt
      );
    }

    const events = database.prepare(`
      INSERT INTO learning_events
        (id, user_id, event_type, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const item of store.learningEvents) {
      events.run(
        item.id,
        item.userId,
        item.eventType,
        JSON.stringify(item.metadata),
        item.createdAt
      );
    }

    const evidence = database.prepare(`
      INSERT INTO mastery_evidence
        (id, user_id, concept_id, previous_mastery, new_mastery, previous_confidence, new_confidence, reason, source, source_id, misconception, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.masteryEvidence) {
      evidence.run(
        item.id,
        item.userId,
        item.conceptId,
        item.previousMastery,
        item.newMastery,
        item.previousConfidence,
        item.newConfidence,
        item.reason,
        item.source,
        item.sourceId ?? null,
        item.misconception ?? null,
        item.createdAt
      );
    }

    const reviews = database.prepare(`
      INSERT INTO review_schedule
        (id, user_id, concept_id, reason, due_after_completed_lessons, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of store.reviewSchedule) {
      reviews.run(
        item.id,
        item.userId,
        item.conceptId,
        item.reason,
        item.dueAfterCompletedLessons,
        item.status,
        item.createdAt,
        item.updatedAt
      );
    }

    database.exec("COMMIT;");
  } catch (error) {
    database.exec("ROLLBACK;");
    throw error;
  }
}

export async function writeStore(store: DataStore) {
  const database = await openDb();
  writeStoreToDb(database, store);
}

export async function mutateStore<T>(mutator: (store: DataStore) => T | Promise<T>) {
  const run = async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  };
  const result = mutationQueue.then(run, run);
  mutationQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}
