import { makeId, nowIso } from "@/lib/db/store";
import { generateAssessmentQuestion } from "@/lib/ai/AIService";
import { recordMasteryEvidence } from "@/lib/adaptive/evidenceEngine";
import { initialMasteryForLevel } from "@/lib/adaptive/masteryEngine";
import {
  getSubjectConcepts,
  getSubjectQuestions
} from "@/lib/adaptive/subjectEngine";
import type {
  AssessmentQuestion,
  AssessmentSession,
  DataStore,
  Difficulty,
  LearnerMastery,
  User
} from "@/lib/types";

export function ensureMasteryRecords(store: DataStore, user: User) {
  const concepts = getSubjectConcepts(store, user.subject);
  for (const concept of concepts) {
    const existing = store.learnerMastery.find(
      (item) => item.userId === user.id && item.conceptId === concept.id
    );
    if (!existing) {
      const masteryScore = initialMasteryForLevel(user.selfRatedLevel, concept.id);
      store.learnerMastery.push({
        id: makeId("mastery"),
        userId: user.id,
        conceptId: concept.id,
        masteryScore,
        confidence: 0.35,
        updatedAt: nowIso()
      });
      recordMasteryEvidence(store, {
        userId: user.id,
        conceptId: concept.id,
        previousMastery: 0,
        newMastery: masteryScore,
        previousConfidence: 0,
        newConfidence: 0.35,
        reason: `Initial estimate from self-rated level: ${user.selfRatedLevel}.`,
        source: "onboarding_estimate"
      });
    }
  }
}

function subjectConceptIds(store: DataStore, subject: string) {
  return new Set(
    store.concepts.filter((concept) => concept.subject === subject).map((concept) => concept.id)
  );
}

export function getMasteryRecordsForSubject(
  store: DataStore,
  userId: string,
  subject: string
): LearnerMastery[] {
  const conceptIds = subjectConceptIds(store, subject);
  return store.learnerMastery.filter(
    (item) => item.userId === userId && conceptIds.has(item.conceptId)
  );
}

export function pruneMasteryOutsideSubject(
  store: DataStore,
  userId: string,
  subject: string
) {
  const conceptIds = subjectConceptIds(store, subject);
  store.learnerMastery = store.learnerMastery.filter(
    (item) => item.userId !== userId || conceptIds.has(item.conceptId)
  );
}

export function getMasteryMap(store: DataStore, userId: string, subject: string) {
  return Object.fromEntries(
    getMasteryRecordsForSubject(store, userId, subject).map((item) => [
      item.conceptId,
      item.masteryScore
    ])
  );
}

export function getConfidenceMap(store: DataStore, userId: string, subject: string) {
  return Object.fromEntries(
    getMasteryRecordsForSubject(store, userId, subject).map((item) => [
      item.conceptId,
      item.confidence
    ])
  );
}

export function getMasteryRecord(
  store: DataStore,
  userId: string,
  conceptId: string
): LearnerMastery {
  let record = store.learnerMastery.find(
    (item) => item.userId === userId && item.conceptId === conceptId
  );
  if (!record) {
    record = {
      id: makeId("mastery"),
      userId,
      conceptId,
      masteryScore: 0.3,
      confidence: 0.35,
      updatedAt: nowIso()
    };
    store.learnerMastery.push(record);
    recordMasteryEvidence(store, {
      userId,
      conceptId,
      previousMastery: 0,
      newMastery: record.masteryScore,
      previousConfidence: 0,
      newConfidence: record.confidence,
      reason: "Created fallback mastery estimate because no prior record existed.",
      source: "onboarding_estimate"
    });
  }
  return record;
}

export function createAssessmentSession(store: DataStore, user: User) {
  ensureMasteryRecords(store, user);
  const concepts = getSubjectConcepts(store, user.subject);
  const questions = getSubjectQuestions(store, user.subject);
  const firstConcept =
    concepts[
      user.selfRatedLevel.toLowerCase().includes("intermediate") && concepts.length > 1
        ? 1
        : 0
    ]?.id;
  if (!firstConcept) throw new Error("No concepts available for this subject.");
  const firstQuestion = generateAssessmentQuestion(firstConcept, 2, [], questions);

  if (!firstQuestion) {
    throw new Error("No assessment question available.");
  }

  const session: AssessmentSession = {
    id: makeId("assess"),
    userId: user.id,
    subject: user.subject,
    status: "in_progress",
    startedAt: nowIso(),
    currentQuestionId: firstQuestion.id,
    askedQuestionIds: [firstQuestion.id]
  };

  store.assessmentSessions.push(session);
  return { session, firstQuestion };
}

export function publicQuestion(question: AssessmentQuestion) {
  return {
    questionId: question.id,
    conceptId: question.conceptId,
    question: question.question,
    type: question.type,
    options: question.options,
    difficulty: question.difficulty
  };
}

export function getQuestionById(store: DataStore, questionId?: string) {
  return store.assessmentQuestions.find((question) => question.id === questionId);
}

function selectUnaskedQuestion(
  questions: AssessmentQuestion[],
  conceptId: string,
  difficulty: Difficulty,
  askedIds: string[]
) {
  const question =
    generateAssessmentQuestion(conceptId, difficulty, askedIds, questions) ??
    questions.find(
      (item) => item.conceptId === conceptId && !askedIds.includes(item.id)
    );
  return question;
}

function difficultyForMastery(mastery: number): Difficulty {
  if (mastery > 0.72) return 3;
  return 2;
}

export function chooseNextQuestion(store: DataStore, session: AssessmentSession) {
  const concepts = getSubjectConcepts(store, session.subject);
  const questions = getSubjectQuestions(store, session.subject);
  const conceptOrder = concepts.map((concept) => concept.id);
  const answers = store.assessmentAnswers.filter(
    (answer) => answer.sessionId === session.id
  );
  const coveredConcepts = new Set(answers.map((answer) => answer.conceptId));
  const maxQuestions = 14;
  const minQuestions = 10;

  if (
    answers.length >= maxQuestions ||
    (answers.length >= minQuestions && coveredConcepts.size === conceptOrder.length)
  ) {
    session.status = "completed";
    session.completedAt = nowIso();
    session.currentQuestionId = undefined;
    return undefined;
  }

  const lastAnswer = answers.at(-1);
  const mastery = getMasteryMap(store, session.userId, session.subject);
  const confidence = getConfidenceMap(store, session.userId, session.subject);

  if (lastAnswer && !lastAnswer.isCorrect) {
    const easierDifficulty = Math.max(1, lastAnswer.difficulty - 1) as Difficulty;
    const easierSameConcept = selectUnaskedQuestion(
      questions,
      lastAnswer.conceptId,
      easierDifficulty,
      session.askedQuestionIds
    );
    if (easierSameConcept) return easierSameConcept;

    const concept = concepts.find((item) => item.id === lastAnswer.conceptId);
    const prereq = concept?.prerequisites.find(
      (conceptId) => !coveredConcepts.has(conceptId)
    );
    if (prereq) {
      const question = selectUnaskedQuestion(questions, prereq, 1, session.askedQuestionIds);
      if (question) return question;
    }
  }

  const uncoveredConceptId = conceptOrder.find(
    (conceptId) => !coveredConcepts.has(conceptId)
  );
  if (uncoveredConceptId) {
    return selectUnaskedQuestion(
      questions,
      uncoveredConceptId,
      difficultyForMastery(mastery[uncoveredConceptId] ?? 0.4),
      session.askedQuestionIds
    );
  }

  const uncertainConceptId = Object.entries(mastery)
    .filter(
      ([conceptId]) =>
        conceptOrder.includes(conceptId) &&
        questions.some(
        (question) =>
          question.conceptId === conceptId &&
          !session.askedQuestionIds.includes(question.id)
      )
    )
    .sort(([conceptA, masteryA], [conceptB, masteryB]) => {
      const confidenceDelta =
        (confidence[conceptA] ?? 0.35) - (confidence[conceptB] ?? 0.35);
      return (
        confidenceDelta ||
        Math.abs(masteryA - 0.55) - Math.abs(masteryB - 0.55)
      );
    })[0]?.[0];

  if (uncertainConceptId) {
    return selectUnaskedQuestion(
      questions,
      uncertainConceptId,
      difficultyForMastery(mastery[uncertainConceptId] ?? 0.5),
      session.askedQuestionIds
    );
  }

  session.status = "completed";
  session.completedAt = nowIso();
  session.currentQuestionId = undefined;
  return undefined;
}
