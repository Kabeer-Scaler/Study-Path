export type Difficulty = 1 | 2 | 3;

export type QuestionType =
  | "multiple_choice"
  | "short_answer"
  | "code_output"
  | "fill_blank";

export type LessonStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "needs_review"
  | "skipped"
  | "mastered";

export type AssessmentStatus = "in_progress" | "completed";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  sessionToken?: string;
  name: string;
  subject: string;
  goal: string;
  selfRatedLevel: string;
  preferredStyle: string;
  dailyTimeMinutes: number;
  createdAt: string;
}

export interface Concept {
  id: string;
  subject: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  prerequisites: string[];
}

export interface AssessmentQuestion {
  id: string;
  conceptId: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
  difficulty: Difficulty;
}

export interface AssessmentSession {
  id: string;
  userId: string;
  subject: string;
  status: AssessmentStatus;
  startedAt: string;
  completedAt?: string;
  currentQuestionId?: string;
  askedQuestionIds: string[];
}

export interface AssessmentAnswer {
  id: string;
  sessionId: string;
  conceptId: string;
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  misconception?: string;
  difficulty: Difficulty;
  createdAt: string;
}

export interface LearnerMastery {
  id: string;
  userId: string;
  conceptId: string;
  masteryScore: number;
  confidence: number;
  updatedAt: string;
}

export interface Curriculum {
  id: string;
  userId: string;
  subject: string;
  title: string;
  generatedReason: string;
  version: number;
  changeReason: string;
  isLatest: boolean;
  parentCurriculumId?: string;
  createdAt: string;
}

export interface Module {
  id: string;
  curriculumId: string;
  title: string;
  description: string;
  reason: string;
  orderIndex: number;
  targetConcepts: string[];
}

export interface LessonContent {
  title: string;
  learningObjective: string;
  intro?: string;
  explanation: string;
  analogy: string;
  example: string;
  codeExample: string;
  commonMistake: string;
  practiceQuestion: {
    question: string;
    code?: string;
    answer: string;
    hint: string;
  };
  quiz: Array<{
    questionId: string;
    question: string;
    type: QuestionType;
    options?: string[];
    correctAnswer: string;
    acceptedAnswers?: string[];
    explanation: string;
  }>;
}

export interface Lesson {
  id: string;
  moduleId: string;
  conceptId: string;
  title: string;
  content: LessonContent;
  estimatedMinutes: number;
  orderIndex: number;
  status: LessonStatus;
  masteryTarget: number;
  whyAssigned: string;
  whySkipped?: string;
  isRemedial?: boolean;
  isChallenge?: boolean;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  lessonId: string;
  conceptId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  createdAt: string;
}

export interface TutorMessage {
  id: string;
  userId: string;
  lessonId?: string;
  role: "user" | "assistant";
  message: string;
  tutorStrategy?: "guiding_question" | "hint" | "explanation";
  createdAt: string;
}

export interface LearningEvent {
  id: string;
  userId: string;
  eventType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface MasteryEvidence {
  id: string;
  userId: string;
  conceptId: string;
  previousMastery: number;
  newMastery: number;
  previousConfidence: number;
  newConfidence: number;
  reason: string;
  source: "onboarding_estimate" | "assessment_answer" | "quiz_attempt" | "challenge";
  sourceId?: string;
  misconception?: string;
  createdAt: string;
}

export interface ReviewSchedule {
  id: string;
  userId: string;
  conceptId: string;
  reason: string;
  dueAfterCompletedLessons: number;
  status: "due" | "scheduled" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface DataStore {
  users: User[];
  concepts: Concept[];
  assessmentQuestions: AssessmentQuestion[];
  assessmentSessions: AssessmentSession[];
  assessmentAnswers: AssessmentAnswer[];
  learnerMastery: LearnerMastery[];
  curricula: Curriculum[];
  modules: Module[];
  lessons: Lesson[];
  quizAttempts: QuizAttempt[];
  tutorMessages: TutorMessage[];
  learningEvents: LearningEvent[];
  masteryEvidence: MasteryEvidence[];
  reviewSchedule: ReviewSchedule[];
}

export interface DashboardData {
  overallProgress: number;
  currentModule: string;
  completedLessons: number;
  totalLessons: number;
  weakAreas: string[];
  strongAreas: string[];
  recommendedNextStep: string;
  mastery: Record<string, number>;
  confidence: Record<string, number>;
  conceptNames: Record<string, string>;
  conceptOrder: string[];
  needsMoreEvidence: string[];
  reviewDue: string[];
  masteryEvidence: MasteryEvidence[];
  timeSpentMinutes: number;
  recentQuizScores: QuizAttempt[];
  modules: Array<Module & { lessons: Lesson[]; completedCount: number }>;
  nextLesson?: Lesson;
}
