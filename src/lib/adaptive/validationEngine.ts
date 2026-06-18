import { getMasteryRecordsForSubject } from "@/lib/adaptive/assessmentEngine";
import type { Concept, DataStore, Lesson, LessonContent, Module } from "@/lib/types";

const blockedPythonPatterns = [
  /\bimport\s+os\b/,
  /\bimport\s+subprocess\b/,
  /\bwhile\s+True\b/,
  /\bopen\s*\(/,
  /\beval\s*\(/,
  /\bexec\s*\(/,
  /\brequests\./
];

export function validatePythonSnippet(code: string) {
  if (!code.trim()) return true;
  return !blockedPythonPatterns.some((pattern) => pattern.test(code));
}

export function validateLessonContent(
  content: LessonContent,
  conceptId: string,
  concepts?: Concept[]
) {
  const errors: string[] = [];
  const requiredText = [
    content.title,
    content.learningObjective,
    content.explanation,
    content.analogy,
    content.example,
    content.commonMistake,
    content.practiceQuestion?.question,
    content.practiceQuestion?.answer,
    content.practiceQuestion?.hint
  ];

  if (requiredText.some((value) => !value?.trim())) {
    errors.push("Lesson has missing required fields.");
  }
  if (!validatePythonSnippet(content.codeExample)) {
    errors.push("Lesson code example contains a blocked Python pattern.");
  }
  if (content.practiceQuestion?.code && !validatePythonSnippet(content.practiceQuestion.code)) {
    errors.push("Practice code contains a blocked Python pattern.");
  }
  if (!Array.isArray(content.quiz) || content.quiz.length === 0) {
    errors.push("Lesson quiz is empty.");
  }
  for (const quiz of content.quiz ?? []) {
    if (!quiz.question?.trim() || !quiz.correctAnswer?.trim()) {
      errors.push("Quiz question is missing a question or correct answer.");
    }
  }

  if (concepts) {
    const concept = concepts.find((item) => item.id === conceptId);
    if (!concept) errors.push("Lesson references an unknown concept.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateCurriculumOrdering({
  store,
  userId,
  subject,
  modules,
  lessons
}: {
  store: DataStore;
  userId: string;
  subject: string;
  modules: Module[];
  lessons: Lesson[];
}) {
  const errors: string[] = [];
  const moduleOrder = new Map(modules.map((module) => [module.id, module.orderIndex]));
  const orderedLessons = [...lessons].sort((a, b) => {
    const moduleDelta =
      (moduleOrder.get(a.moduleId) ?? 0) - (moduleOrder.get(b.moduleId) ?? 0);
    return moduleDelta || a.orderIndex - b.orderIndex;
  });
  const seenConcepts = new Set<string>();
  const activeConcepts = new Map<string, Lesson>();
  const masteryRecords = Object.fromEntries(
    getMasteryRecordsForSubject(store, userId, subject).map((item) => [
      item.conceptId,
      item
    ])
  );

  for (const lesson of orderedLessons) {
    const concept = store.concepts.find((item) => item.id === lesson.conceptId);
    if (!concept) {
      errors.push(`Unknown concept ${lesson.conceptId}.`);
      continue;
    }

    const activeDuplicate = activeConcepts.get(lesson.conceptId);
    if (
      activeDuplicate &&
      !lesson.isRemedial &&
      !activeDuplicate.isRemedial &&
      !lesson.isChallenge &&
      !activeDuplicate.isChallenge &&
      lesson.status !== "skipped"
    ) {
      errors.push(`Duplicate active lesson for ${lesson.conceptId}.`);
    }
    if (lesson.status !== "skipped") activeConcepts.set(lesson.conceptId, lesson);

    for (const prerequisite of concept.prerequisites) {
      const record = masteryRecords[prerequisite];
      const mastered =
        record && record.masteryScore >= 0.85 && record.confidence >= 0.7;
      if (!mastered && !seenConcepts.has(prerequisite)) {
        errors.push(
          `${concept.id} appears before prerequisite ${prerequisite} is mastered or taught.`
        );
      }
    }
    seenConcepts.add(lesson.conceptId);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function parseAiJsonWithFallback<T>(
  raw: string,
  validate: (value: unknown) => value is T,
  fallback: T
) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (validate(parsed)) return { value: parsed, usedFallback: false };
    } catch {
      // Retry loop intentionally falls through to fallback after two attempts.
    }
  }
  return { value: fallback, usedFallback: true };
}
