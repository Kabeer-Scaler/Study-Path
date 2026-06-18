import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAssessmentAntiGamingCap,
  updateAssessmentConfidence,
  updateAssessmentMastery,
  updateLessonMastery
} from "../src/lib/adaptive/masteryEngine";
import {
  getMasteryRecordsForSubject,
  pruneMasteryOutsideSubject
} from "../src/lib/adaptive/assessmentEngine";
import {
  generateCurriculumForUser,
  getCurriculumBundle,
  insertRemedialLesson
} from "../src/lib/adaptive/curriculumEngine";
import { buildDashboard } from "../src/lib/adaptive/recommendationEngine";
import { validateCurriculumOrdering, parseAiJsonWithFallback, validateLessonContent } from "../src/lib/adaptive/validationEngine";
import { classifyTutorResponse, generateTutorResponse, resolveTutorStrategy } from "../src/lib/ai/AIService";
import { buildLessonUserPrompt, normalizePreferredStyle } from "../src/lib/ai/promptBuilder";
import { buildForbiddenTexts } from "../src/lib/ai/tutorPolicy";
import { getAIProvider } from "../src/lib/ai/provider";
import {
  assessmentQuestions,
  concepts,
  DEFAULT_SUBJECT
} from "../src/lib/db/seed";
import { ensureSubjectDomain, getSubjectConcepts, getSubjectQuestions } from "../src/lib/adaptive/subjectEngine";
import type { DataStore, Lesson, User } from "../src/lib/types";

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

function addUser(store: DataStore, name = "Tester"): User {
  const user: User = {
    id: `user_${name.toLowerCase()}`,
    email: `${name.toLowerCase()}@example.com`,
    passwordHash: "test:hash",
    sessionToken: "test-session",
    name,
    subject: DEFAULT_SUBJECT,
    goal: "Test adaptive learning",
    selfRatedLevel: "Beginner",
    preferredStyle: "Examples and practice",
    dailyTimeMinutes: 30,
    createdAt: "2026-06-10T00:00:00.000Z"
  };
  store.users.push(user);
  return user;
}

function setMastery(
  store: DataStore,
  user: User,
  values: Record<string, { mastery: number; confidence: number }>
) {
  for (const concept of concepts) {
    const value = values[concept.id] ?? { mastery: 0.4, confidence: 0.7 };
    store.learnerMastery.push({
      id: `mastery_${user.id}_${concept.id}`,
      userId: user.id,
      conceptId: concept.id,
      masteryScore: value.mastery,
      confidence: value.confidence,
      updatedAt: "2026-06-10T00:00:00.000Z"
    });
  }
}

function assertDifficultyLadder(store: DataStore, subject: string) {
  const conceptsForSubject = getSubjectConcepts(store, subject);
  const questionsForSubject = getSubjectQuestions(store, subject);
  for (const concept of conceptsForSubject) {
    const difficulties = new Set(
      questionsForSubject
        .filter((question) => question.conceptId === concept.id)
        .map((question) => question.difficulty)
    );
    assert.deepEqual([...difficulties].sort(), [1, 2, 3]);
  }
}

test("normalizePreferredStyle maps onboarding strings to lesson modes", () => {
  assert.equal(normalizePreferredStyle("Examples and practice"), "examples");
  assert.equal(normalizePreferredStyle("Code walkthroughs"), "code");
  assert.equal(normalizePreferredStyle("Visual diagrams"), "visual");
});

test("buildLessonUserPrompt includes remedial mode and misconceptions", () => {
  const prompt = buildLessonUserPrompt({
    subject: "DevOps",
    conceptId: "ci-cd",
    conceptName: "CI/CD",
    mastery: 0.32,
    style: "examples",
    mode: "remedial",
    misconceptions: ["confuses build with deploy"],
    missedQuestions: ["What runs first in a pipeline?"]
  });
  assert.match(prompt, /mode:remedial/);
  assert.match(prompt, /misconceptions:confuses build with deploy/);
  assert.match(prompt, /missedQuestions:What runs first in a pipeline\?/);
});

test("validateLessonContent rejects thin lessons", () => {
  const thin = {
    title: "Test",
    learningObjective: "Learn test",
    explanation: "Too short.",
    analogy: "Like building blocks.",
    example: "Example here.",
    codeExample: "x = 1",
    commonMistake: "Skipping steps.",
    practiceQuestion: { question: "Q?", answer: "A", hint: "H" },
    quiz: [
      {
        questionId: "q1",
        question: "Q1?",
        type: "multiple_choice" as const,
        options: ["a", "b"],
        correctAnswer: "a",
        explanation: "Because a."
      }
    ]
  };
  const result = validateLessonContent(thin, "variables");
  assert.ok(result.errors.some((error) => /too short/i.test(error)));
  assert.ok(result.errors.some((error) => /at least 3 questions/i.test(error)));
});

test("mastery score increases after a high quiz score", () => {
  assert.equal(updateLessonMastery(0.5, 90), 0.65);
});

test("mastery score clamps between 0 and 1", () => {
  assert.equal(updateLessonMastery(0.95, 100), 1);
  assert.equal(updateLessonMastery(0.02, 40), 0);
});

test("anti-gaming cap prevents one answer from creating strong mastery", () => {
  assert.equal(
    applyAssessmentAntiGamingCap({
      proposedMastery: 0.96,
      evidenceCount: 1,
      confidence: 0.52
    }),
    0.84
  );
});

test("mostly correct assessment does not mark every concept weak", () => {
  const masteryByConcept = Object.fromEntries(
    concepts.map((concept) => {
      const isMissedConcept = concept.id === "debugging";
      const confidence = updateAssessmentConfidence({
        currentConfidence: 0.35,
        isCorrect: !isMissedConcept,
        previousConceptAnswers: []
      });
      const proposedMastery = updateAssessmentMastery(
        0.32,
        !isMissedConcept,
        2
      );
      const mastery = applyAssessmentAntiGamingCap({
        proposedMastery,
        evidenceCount: 1,
        confidence
      });
      return [concept.id, mastery];
    })
  );
  const weakConceptIds = Object.entries(masteryByConcept)
    .filter(([, mastery]) => mastery < 0.6)
    .map(([conceptId]) => conceptId);

  assert.deepEqual(weakConceptIds, ["debugging"]);
});

test("weak concepts appear in generated curriculum", () => {
  const store = emptyStore();
  const user = addUser(store, "Weak");
  setMastery(store, user, {
    variables: { mastery: 0.25, confidence: 0.8 },
    operators: { mastery: 0.35, confidence: 0.8 },
    loops: { mastery: 0.3, confidence: 0.8 }
  });
  generateCurriculumForUser(store, user);
  const bundle = getCurriculumBundle(store, user.id);
  const lessonConcepts = bundle?.modules.flatMap((module) =>
    module.lessons.map((lesson) => lesson.conceptId)
  );
  assert.ok(lessonConcepts?.includes("variables"));
  assert.ok(lessonConcepts?.includes("loops"));
});

test("mastered concepts are skipped with high confidence", () => {
  const store = emptyStore();
  const user = addUser(store, "Mastered");
  setMastery(store, user, {
    variables: { mastery: 0.92, confidence: 0.84 },
    operators: { mastery: 0.91, confidence: 0.82 },
    conditionals: { mastery: 0.9, confidence: 0.81 }
  });
  generateCurriculumForUser(store, user);
  const bundle = getCurriculumBundle(store, user.id);
  const skipped = bundle?.modules
    .flatMap((module) => module.lessons)
    .filter((lesson) => lesson.status === "skipped");
  assert.ok(skipped?.some((lesson) => lesson.conceptId === "variables"));
  assert.match(skipped?.[0]?.whySkipped ?? "", /Skipped because/);
});

test("curriculum prerequisites are ordered correctly", () => {
  const store = emptyStore();
  const user = addUser(store, "Order");
  setMastery(store, user, {
    variables: { mastery: 0.9, confidence: 0.8 },
    operators: { mastery: 0.9, confidence: 0.8 },
    conditionals: { mastery: 0.9, confidence: 0.8 },
    loops: { mastery: 0.9, confidence: 0.8 },
    functions: { mastery: 0.3, confidence: 0.8 },
    lists: { mastery: 0.3, confidence: 0.8 },
    dictionaries: { mastery: 0.3, confidence: 0.8 }
  });
  generateCurriculumForUser(store, user);
  const bundle = getCurriculumBundle(store, user.id);
  assert.ok(bundle);
  const validation = validateCurriculumOrdering({
    store,
    userId: user.id,
    subject: user.subject,
    modules: bundle.modules,
    lessons: bundle.modules.flatMap((module) => module.lessons)
  });
  assert.deepEqual(validation.errors, []);
});

test("failed quiz inserts remedial lesson and preserves prior curriculum version", () => {
  const store = emptyStore();
  const user = addUser(store, "Remedial");
  setMastery(store, user, {
    variables: { mastery: 0.65, confidence: 0.8 }
  });
  const curriculum = generateCurriculumForUser(store, user);
  const bundle = getCurriculumBundle(store, user.id);
  const lesson = bundle?.modules
    .flatMap((module) => module.lessons)
    .find((item) => item.conceptId === "variables") as Lesson;
  lesson.status = "needs_review";
  const remedial = insertRemedialLesson(store, lesson, user);
  assert.ok(remedial);
  assert.equal(store.curricula.find((item) => item.id === curriculum.id)?.isLatest, false);
  assert.equal(getCurriculumBundle(store, user.id)?.curriculum.version, 2);
});

test("dashboard progress equals completed lessons divided by total lessons", () => {
  const store = emptyStore();
  const user = addUser(store, "Progress");
  store.curricula.push({
    id: "curr_progress",
    userId: user.id,
    subject: user.subject,
    title: "Progress Path",
    generatedReason: "Test",
    version: 1,
    changeReason: "Test",
    isLatest: true,
    createdAt: "2026-06-10T00:00:00.000Z"
  });
  store.modules.push({
    id: "mod_progress",
    curriculumId: "curr_progress",
    title: "Progress Module",
    description: "",
    reason: "",
    orderIndex: 0,
    targetConcepts: ["variables"]
  });
  const baseLesson = {
    moduleId: "mod_progress",
    conceptId: "variables",
    content: {
      title: "Variables",
      learningObjective: "",
      explanation: "",
      analogy: "",
      example: "",
      codeExample: "",
      commonMistake: "",
      practiceQuestion: { question: "", answer: "", hint: "" },
      quiz: []
    },
    estimatedMinutes: 10,
    masteryTarget: 0.8,
    whyAssigned: "Test"
  };
  store.lessons.push(
    { ...baseLesson, id: "lesson_done", title: "Done", orderIndex: 0, status: "completed" },
    { ...baseLesson, id: "lesson_next", title: "Next", orderIndex: 1, status: "not_started" }
  );
  const dashboard = buildDashboard(store, user.id);
  assert.equal(dashboard.overallProgress, 50);
});

test("resolveTutorStrategy escalates by turn count", () => {
  assert.equal(resolveTutorStrategy(1, "just tell me the answer"), "guiding_question");
  assert.equal(resolveTutorStrategy(2, "I am stuck"), "hint");
  assert.equal(resolveTutorStrategy(3, "still confused"), "explanation");
  assert.equal(resolveTutorStrategy(1, "I give up"), "explanation");
});

test("classifyTutorResponse rejects leaky LLM replies", () => {
  const concept = concepts.find((item) => item.id === "loops");
  assert.ok(concept);
  const forbiddenTexts = buildForbiddenTexts({
    title: "Loops",
    learningObjective: "Understand loops",
    explanation: "Loops repeat code.",
    analogy: "Like a playlist on repeat.",
    example: "for i in range(3): print(i)",
    codeExample: "for i in range(3):\n    print(i)",
    commonMistake: "Off-by-one errors.",
    practiceQuestion: {
      question: "What does this loop print?",
      answer: "0, 1, 2",
      hint: "Count from zero."
    },
    quiz: [
      {
        questionId: "q1",
        question: "How many times does range(3) iterate?",
        type: "multiple_choice",
        options: ["3", "2", "4", "0"],
        correctAnswer: "3",
        explanation: "range(3) yields 0, 1, 2."
      }
    ]
  });

  const leaky = classifyTutorResponse({
    reply: "The answer is 3",
    requiredStrategy: "guiding_question",
    userTurns: 1,
    message: "just tell me",
    concept,
    forbiddenTexts
  });
  assert.equal(leaky.valid, false);

  const quotesAnswer = classifyTutorResponse({
    reply: "Remember that the correct option is 3 because range counts three values.",
    requiredStrategy: "guiding_question",
    userTurns: 1,
    message: "help",
    concept,
    forbiddenTexts
  });
  assert.equal(quotesAnswer.valid, false);

  const valid = classifyTutorResponse({
    reply: "What do you think happens on the first iteration of the loop?",
    requiredStrategy: "guiding_question",
    userTurns: 1,
    message: "just tell me",
    concept,
    forbiddenTexts
  });
  assert.equal(valid.valid, true);
});

test("tutor first response does not directly reveal the answer", () => {
  const concept = concepts.find((item) => item.id === "loops");
  assert.ok(concept);
  const priorMessages = [
    {
      id: "msg_user",
      userId: "user_test",
      lessonId: "lesson_test",
      role: "user" as const,
      message: "Can you just tell me what this loop prints?",
      createdAt: "2026-06-10T00:00:00.000Z"
    }
  ];
  const response = generateTutorResponse({
    concept,
    lessonTitle: "For Loops",
    mastery: 0.4,
    message: "Can you just tell me what this loop prints?",
    priorMessages,
    requiredStrategy: resolveTutorStrategy(1, "Can you just tell me what this loop prints?"),
    practiceStem: "What does this loop print?"
  });
  const policy = classifyTutorResponse({
    reply: response.reply,
    requiredStrategy: "guiding_question",
    userTurns: 1,
    message: "Can you just tell me what this loop prints?",
    concept,
    forbiddenTexts: ["0, 1, 2"]
  });
  assert.equal(policy.valid, true);
  assert.equal(response.tutorStrategy, "guiding_question");
  assert.doesNotMatch(response.reply, /0,\s*1,\s*2/);
});

test("invalid AI JSON triggers fallback", () => {
  const fallback = { title: "Fallback" };
  const result = parseAiJsonWithFallback(
    "{ bad json",
    (value): value is typeof fallback =>
      typeof value === "object" && value !== null && "title" in value,
    fallback
  );
  assert.equal(result.usedFallback, true);
  assert.deepEqual(result.value, fallback);
});

test("arbitrary topics require an LLM provider instead of generic fallback questions", async () => {
  const store = emptyStore();
  const previousProvider = process.env.LLM_PROVIDER;
  process.env.LLM_PROVIDER = "fallback";
  await assert.rejects(
    () => ensureSubjectDomain(store, "Photosynthesis"),
    /requires an LLM provider/
  );
  if (previousProvider === undefined) {
    delete process.env.LLM_PROVIDER;
  } else {
    process.env.LLM_PROVIDER = previousProvider;
  }
});

test("machine learning fallback questions are factual and not repeated meta templates", async () => {
  const store = emptyStore();
  const previousProvider = process.env.LLM_PROVIDER;
  process.env.LLM_PROVIDER = "fallback";
  await ensureSubjectDomain(store, "Machine Learning");
  if (previousProvider === undefined) {
    delete process.env.LLM_PROVIDER;
  } else {
    process.env.LLM_PROVIDER = previousProvider;
  }

  const questions = getSubjectQuestions(store, "Machine Learning");
  const questionText = questions.map((question) => question.question).join(" ");
  const answerText = questions.map((question) => question.correctAnswer).join(" ");

  assert.doesNotMatch(questionText, /what evidence should the system trust most/i);
  assert.doesNotMatch(questionText, /usable understanding rather than memorisation/i);
  assert.match(questionText, /house-price prediction|spam|test set|training data/i);
  assert.match(answerText, /Overfitting|Classification|Regression|Recall/i);
  assertDifficultyLadder(store, "Machine Learning");
});

test("getAIProvider returns azure when Azure env vars are set", () => {
  const previousProvider = process.env.LLM_PROVIDER;
  const previousEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const previousKey = process.env.AZURE_OPENAI_API_KEY;
  const previousDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  process.env.LLM_PROVIDER = "azure";
  process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
  process.env.AZURE_OPENAI_API_KEY = "test-key";
  process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4o-mini";
  assert.equal(getAIProvider(), "azure");

  if (previousProvider === undefined) delete process.env.LLM_PROVIDER;
  else process.env.LLM_PROVIDER = previousProvider;
  if (previousEndpoint === undefined) delete process.env.AZURE_OPENAI_ENDPOINT;
  else process.env.AZURE_OPENAI_ENDPOINT = previousEndpoint;
  if (previousKey === undefined) delete process.env.AZURE_OPENAI_API_KEY;
  else process.env.AZURE_OPENAI_API_KEY = previousKey;
  if (previousDeployment === undefined) delete process.env.AZURE_OPENAI_DEPLOYMENT;
  else process.env.AZURE_OPENAI_DEPLOYMENT = previousDeployment;
});

test("LLM provider replaces seeded Python assessment with generated domain", async () => {
  const store = emptyStore();
  store.assessmentQuestions = [...assessmentQuestions];
  const previousProvider = process.env.LLM_PROVIDER;
  const previousKey = process.env.GROQ_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.LLM_PROVIDER = "groq";
  process.env.GROQ_API_KEY = "test-key";
  const generatedConcepts = [
    "syntax",
    "variables",
    "control-flow",
    "functions",
    "debugging"
  ];
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                concepts: generatedConcepts.map((id, index) => ({
                  id,
                  name: `Generated ${id}`,
                  description: `Generated description for ${id}`,
                  difficulty: index < 2 ? 1 : index < 4 ? 2 : 3,
                  prerequisites: index === 0 ? [] : [generatedConcepts[index - 1]]
                })),
                questions: generatedConcepts.flatMap((conceptId) =>
                  [1, 2, 3].map((difficulty) => ({
                    conceptId,
                    question: `In a short ${conceptId} program, unexpected behavior appears after one rule changes. Which detail should be checked first?`,
                    type: "multiple_choice",
                    options: [
                      "The specific rule or step that controls the behavior",
                      "The data values that are unrelated to the symptom",
                      "The final output without checking intermediate steps",
                      "The most recent line changed before the behavior appeared"
                    ],
                    correctAnswer: "The specific rule or step that controls the behavior",
                    acceptedAnswers: ["The specific rule or step that controls the behavior"],
                    explanation: "The controlling rule explains why the behavior changed in the program.",
                    difficulty
                  }))
                )
              })
            }
          }
        ]
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )) as typeof fetch;

  await ensureSubjectDomain(store, DEFAULT_SUBJECT);

  globalThis.fetch = previousFetch;
  if (previousProvider === undefined) {
    delete process.env.LLM_PROVIDER;
  } else {
    process.env.LLM_PROVIDER = previousProvider;
  }
  if (previousKey === undefined) {
    delete process.env.GROQ_API_KEY;
  } else {
    process.env.GROQ_API_KEY = previousKey;
  }

  const subjectConcepts = getSubjectConcepts(store, DEFAULT_SUBJECT);
  const subjectQuestions = getSubjectQuestions(store, DEFAULT_SUBJECT);
  assert.ok(subjectConcepts.every((concept) => concept.id.startsWith("python_programming_fundamentals_")));
  assert.ok(subjectQuestions.every((question) => !assessmentQuestions.some((seeded) => seeded.id === question.id)));
  assertDifficultyLadder(store, DEFAULT_SUBJECT);
});

test("mastery reads are scoped to the learner's current subject", () => {
  const store = emptyStore();
  const devopsSubject = "DevOps";
  store.concepts.push(
    {
      id: "devops-ci-cd",
      subject: devopsSubject,
      name: "CI/CD",
      description: "Continuous integration and delivery.",
      difficulty: 2,
      prerequisites: []
    },
    {
      id: "devops-iac",
      subject: devopsSubject,
      name: "Infrastructure as Code",
      description: "Managing infrastructure declaratively.",
      difficulty: 2,
      prerequisites: ["devops-ci-cd"]
    }
  );

  const user = addUser(store, "Scoped");
  user.subject = devopsSubject;
  store.learnerMastery.push(
    {
      id: "mastery_scoped_python_variables",
      userId: user.id,
      conceptId: "variables",
      masteryScore: 0.32,
      confidence: 0.7,
      updatedAt: "2026-06-10T00:00:00.000Z"
    },
    {
      id: "mastery_scoped_python_operators",
      userId: user.id,
      conceptId: "operators",
      masteryScore: 0.32,
      confidence: 0.7,
      updatedAt: "2026-06-10T00:00:00.000Z"
    },
    {
      id: "mastery_scoped_devops_ci",
      userId: user.id,
      conceptId: "devops-ci-cd",
      masteryScore: 0.8,
      confidence: 0.67,
      updatedAt: "2026-06-10T00:00:00.000Z"
    },
    {
      id: "mastery_scoped_devops_iac",
      userId: user.id,
      conceptId: "devops-iac",
      masteryScore: 0.75,
      confidence: 0.6,
      updatedAt: "2026-06-10T00:00:00.000Z"
    }
  );

  const scoped = getMasteryRecordsForSubject(store, user.id, devopsSubject);
  assert.equal(scoped.length, 2);
  assert.ok(scoped.every((record) => record.conceptId.startsWith("devops-")));
  assert.ok(scoped.every((record) => !["variables", "operators"].includes(record.conceptId)));

  generateCurriculumForUser(store, user);
  const bundle = getCurriculumBundle(store, user.id);
  const lessonConcepts = bundle?.modules.flatMap((module) =>
    module.lessons.map((lesson) => lesson.conceptId)
  );
  assert.ok(lessonConcepts?.every((conceptId) => conceptId.startsWith("devops-")));

  const dashboard = buildDashboard(store, user.id);
  assert.ok(dashboard.weakAreas.every((name) => !/variables|operators/i.test(name)));
  assert.ok(
    dashboard.strongAreas.every((name) => !/variables|operators/i.test(name))
  );

  pruneMasteryOutsideSubject(store, user.id, devopsSubject);
  assert.equal(
    store.learnerMastery.filter((item) => item.userId === user.id).length,
    2
  );
});

test("mastery reads match subject case-insensitively", () => {
  const store = emptyStore();
  const conceptSubject = "DevOps and platform eng";
  store.concepts.push(
    {
      id: "devops_principles",
      subject: conceptSubject,
      name: "DevOps Principles",
      description: "Collaboration and automation.",
      difficulty: 1,
      prerequisites: []
    },
    {
      id: "devops_ci_cd",
      subject: conceptSubject,
      name: "CI/CD",
      description: "Continuous integration and delivery.",
      difficulty: 2,
      prerequisites: ["devops_principles"]
    }
  );

  const user = addUser(store, "Case");
  user.subject = "DEVOPS AND PLATFORM ENG";
  store.learnerMastery.push(
    {
      id: "mastery_devops_principles",
      userId: user.id,
      conceptId: "devops_principles",
      masteryScore: 0.62,
      confidence: 0.7,
      updatedAt: "2026-06-10T00:00:00.000Z"
    },
    {
      id: "mastery_devops_ci_cd",
      userId: user.id,
      conceptId: "devops_ci_cd",
      masteryScore: 0.68,
      confidence: 0.67,
      updatedAt: "2026-06-10T00:00:00.000Z"
    }
  );

  const scoped = getMasteryRecordsForSubject(store, user.id, user.subject);
  assert.equal(scoped.length, 2);

  const dashboard = buildDashboard(store, user.id);
  assert.equal(Object.keys(dashboard.mastery).length, 2);
  assert.equal(dashboard.conceptOrder.length, 2);
});
