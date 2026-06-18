import { makeId, nowIso } from "@/lib/db/store";
import { generateLesson } from "@/lib/ai/AIService";
import { getMasteryRecordsForSubject } from "@/lib/adaptive/assessmentEngine";
import { getSubjectConcepts } from "@/lib/adaptive/subjectEngine";
import { validateCurriculumOrdering } from "@/lib/adaptive/validationEngine";
import type {
  Curriculum,
  Concept,
  DataStore,
  Lesson,
  Module,
  User
} from "@/lib/types";

function includePrerequisites(
  concepts: Concept[],
  conceptIds: string[],
  included = new Set<string>()
) {
  for (const conceptId of conceptIds) {
    if (included.has(conceptId)) continue;
    const concept = concepts.find((item) => item.id === conceptId);
    if (!concept) continue;
    includePrerequisites(concepts, concept.prerequisites, included);
    included.add(concept.id);
  }
  return included;
}

function topologicalConcepts(concepts: Concept[], conceptIds: Set<string>) {
  return concepts.filter((concept) => conceptIds.has(concept.id));
}

function moduleTitleFor(score: number, confidence: number, conceptName: string) {
  if (score >= 0.85 && confidence < 0.7) return `Challenge Check: ${conceptName}`;
  if (score < 0.5) return `Rebuild ${conceptName}`;
  if (score < 0.75) return `Strengthen ${conceptName}`;
  if (confidence < 0.55) return `Confirm ${conceptName}`;
  return `Skipped: ${conceptName}`;
}

function reasonFor(score: number, confidence: number, conceptName: string) {
  const percent = Math.round(score * 100);
  const confidencePercent = Math.round(confidence * 100);
  if (score >= 0.85 && confidence >= 0.7) {
    return `Skipped because your assessment showed ${percent}% mastery in ${conceptName.toLowerCase()} with ${confidencePercent}% confidence.`;
  }
  if (score >= 0.85 && confidence < 0.7) {
    return `Assigned as a challenge because mastery is high (${percent}%) but confidence is only ${confidencePercent}%, so the system needs stronger evidence before skipping.`;
  }
  if (score < 0.5) {
    return `Assigned because your assessment score for ${conceptName.toLowerCase()} was ${percent}%, so this concept needs review before moving ahead.`;
  }
  if (score < 0.75) {
    return `Assigned because your ${conceptName.toLowerCase()} mastery is ${percent}%, and the target is at least 75%.`;
  }
  return `Assigned because confidence is ${confidencePercent}%, so the system needs more evidence before trusting this estimate.`;
}

export function generateCurriculumForUser(store: DataStore, user: User) {
  const concepts = getSubjectConcepts(store, user.subject);
  const masteryRecords = Object.fromEntries(
    getMasteryRecordsForSubject(store, user.id, user.subject).map((item) => [
      item.conceptId,
      item
    ])
  );
  const masteryMap = Object.fromEntries(
    Object.entries(masteryRecords).map(([conceptId, record]) => [
      conceptId,
      record.masteryScore
    ])
  );
  const confidenceMap = Object.fromEntries(
    Object.entries(masteryRecords).map(([conceptId, record]) => [
      conceptId,
      record.confidence
    ])
  );

  const weakConceptIds = concepts
    .filter((concept) => {
      const score = masteryMap[concept.id] ?? 0.3;
      const confidence = confidenceMap[concept.id] ?? 0.35;
      return score < 0.75 || confidence < 0.55 || (score >= 0.85 && confidence < 0.7);
    })
    .map((concept) => concept.id);

  const requiredConceptIds = includePrerequisites(concepts, weakConceptIds);
  let orderedConcepts = topologicalConcepts(concepts, requiredConceptIds).filter(
    (concept) => {
      const score = masteryMap[concept.id] ?? 0.3;
      const confidence = confidenceMap[concept.id] ?? 0.35;
      return !(score >= 0.85 && confidence >= 0.7);
    }
  );
  const skippedConcepts = concepts.filter((concept) => {
    const score = masteryMap[concept.id] ?? 0.3;
    const confidence = confidenceMap[concept.id] ?? 0.35;
    return score >= 0.85 && confidence >= 0.7;
  });

  if (orderedConcepts.length === 0 && skippedConcepts.length === 0) {
    orderedConcepts = concepts.slice(0, 3);
  }

  const existingCurricula = store.curricula.filter((item) => item.userId === user.id);
  const previousLatest = existingCurricula.find((item) => item.isLatest);
  for (const item of existingCurricula) {
    item.isLatest = false;
  }
  const nextVersion =
    Math.max(0, ...existingCurricula.map((item) => item.version ?? 1)) + 1;

  const curriculum: Curriculum = {
    id: makeId("curr"),
    userId: user.id,
    subject: user.subject,
    title: `${user.name}'s Personalised ${user.subject} Path`,
    generatedReason:
      `Generated for ${user.subject} from concept mastery, prerequisite order, learning style, and daily study time.`,
    version: nextVersion,
    changeReason:
      nextVersion === 1
        ? "Initial path generated after assessment."
        : "Regenerated from latest mastery and confidence evidence.",
    isLatest: true,
    parentCurriculumId: previousLatest?.id,
    createdAt: nowIso()
  };
  store.curricula.push(curriculum);

  let lessonIndex = 0;
  orderedConcepts.forEach((concept, moduleIndex) => {
    const score = masteryMap[concept.id] ?? 0.3;
    const confidence = confidenceMap[concept.id] ?? 0.35;
    const isChallenge = score >= 0.85 && confidence < 0.7;
    const module: Module = {
      id: makeId("mod"),
      curriculumId: curriculum.id,
      title: moduleTitleFor(score, confidence, concept.name),
      description: `Target mastery: ${isChallenge ? "challenge evidence" : score < 0.5 ? "review then core practice" : "short core lesson"}.`,
      reason: reasonFor(score, confidence, concept.name),
      orderIndex: moduleIndex,
      targetConcepts: [concept.id]
    };
    store.modules.push(module);

    const lessonCount = isChallenge ? 1 : score < 0.5 ? 2 : 1;
    for (let index = 0; index < lessonCount; index += 1) {
      const isRemedial = score < 0.5 && index === 0;
      const lesson: Lesson = {
        id: makeId("lesson"),
        moduleId: module.id,
        conceptId: concept.id,
        title: isRemedial
            ? `Review the basics of ${concept.name}`
            : isChallenge
              ? `Challenge: Prove ${concept.name} Mastery`
            : `${concept.name} in Practice`,
        content: generateLesson(concept, score, user.preferredStyle, isRemedial),
        estimatedMinutes: Math.min(25, Math.max(15, user.dailyTimeMinutes - 5)),
        orderIndex: lessonIndex,
        status: "not_started",
        masteryTarget: 0.8,
        whyAssigned: module.reason,
        isRemedial,
        isChallenge
      };
      lessonIndex += 1;
      store.lessons.push(lesson);
    }
  });

  const skippedStartIndex = orderedConcepts.length;
  skippedConcepts.forEach((concept, index) => {
    const score = masteryMap[concept.id] ?? 0.9;
    const confidence = confidenceMap[concept.id] ?? 0.8;
    const reason = reasonFor(score, confidence, concept.name);
    const module: Module = {
      id: makeId("mod"),
      curriculumId: curriculum.id,
      title: moduleTitleFor(score, confidence, concept.name),
      description: "Skipped because mastery and confidence are high.",
      reason,
      orderIndex: skippedStartIndex + index,
      targetConcepts: [concept.id]
    };
    store.modules.push(module);
    store.lessons.push({
      id: makeId("lesson"),
      moduleId: module.id,
      conceptId: concept.id,
      title: `Skipped basic lesson: ${concept.name}`,
      content: generateLesson(concept, score, user.preferredStyle),
      estimatedMinutes: 0,
      orderIndex: lessonIndex,
      status: "skipped",
      masteryTarget: 0.8,
      whyAssigned: reason,
      whySkipped: reason,
      isRemedial: false,
      isChallenge: false
    });
    lessonIndex += 1;
  });

  const newModules = store.modules.filter(
    (module) => module.curriculumId === curriculum.id
  );
  const newLessons = store.lessons.filter((lesson) =>
    newModules.some((module) => module.id === lesson.moduleId)
  );
  const validation = validateCurriculumOrdering({
    store,
    userId: user.id,
    subject: user.subject,
    modules: newModules,
    lessons: newLessons
  });
  if (!validation.valid) {
    curriculum.generatedReason = `${curriculum.generatedReason} Validation warnings: ${validation.errors.join(" ")}`;
    store.learningEvents.push({
      id: makeId("event"),
      userId: user.id,
      eventType: "curriculum_validation_warning",
      metadata: { curriculumId: curriculum.id, errors: validation.errors },
      createdAt: nowIso()
    });
  }

  store.learningEvents.push({
    id: makeId("event"),
    userId: user.id,
    eventType: "curriculum_generated",
    metadata: {
      curriculumId: curriculum.id,
      weakConcepts: weakConceptIds
    },
    createdAt: nowIso()
  });

  return curriculum;
}

export function getCurriculumBundle(store: DataStore, userId: string) {
  const curriculum = store.curricula
    .filter((item) => item.userId === userId)
    .sort((a, b) => {
      if (a.isLatest !== b.isLatest) return a.isLatest ? -1 : 1;
      return (b.version ?? 1) - (a.version ?? 1);
    })[0];
  if (!curriculum) return undefined;
  const modules = store.modules
    .filter((module) => module.curriculumId === curriculum.id)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((module) => ({
      ...module,
      lessons: store.lessons
        .filter((lesson) => lesson.moduleId === module.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)
    }));
  return { curriculum, modules };
}

export function insertRemedialLesson(store: DataStore, lesson: Lesson, user: User) {
  const module = store.modules.find((item) => item.id === lesson.moduleId);
  const concept = store.concepts.find((item) => item.id === lesson.conceptId);
  if (!module || !concept) return undefined;
  const curriculum = store.curricula.find((item) => item.id === module.curriculumId);
  if (!curriculum) return undefined;

  const existing = store.lessons.find(
    (item) =>
      item.moduleId === module.id &&
      item.conceptId === concept.id &&
      item.isRemedial &&
      item.status === "not_started"
  );
  if (existing) return existing;

  curriculum.isLatest = false;
  const newCurriculum: Curriculum = {
    ...curriculum,
    id: makeId("curr"),
    version: (curriculum.version ?? 1) + 1,
    isLatest: true,
    parentCurriculumId: curriculum.id,
    changeReason: `Inserted remedial lesson after low quiz score on ${concept.name}.`,
    createdAt: nowIso()
  };
  store.curricula.push(newCurriculum);

  const oldModules = store.modules
    .filter((item) => item.curriculumId === curriculum.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const moduleIdMap = new Map<string, string>();
  for (const oldModule of oldModules) {
    const clonedModule: Module = {
      ...oldModule,
      id: makeId("mod"),
      curriculumId: newCurriculum.id
    };
    moduleIdMap.set(oldModule.id, clonedModule.id);
    store.modules.push(clonedModule);
  }

  const oldLessons = store.lessons
    .filter((item) => moduleIdMap.has(item.moduleId))
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const lessonIdMap = new Map<string, string>();
  for (const oldLesson of oldLessons) {
    const clonedLesson: Lesson = {
      ...oldLesson,
      id: makeId("lesson"),
      moduleId: moduleIdMap.get(oldLesson.moduleId) ?? oldLesson.moduleId,
      status: oldLesson.id === lesson.id ? "needs_review" : oldLesson.status
    };
    lessonIdMap.set(oldLesson.id, clonedLesson.id);
    store.lessons.push(clonedLesson);
  }

  const clonedLessonId = lessonIdMap.get(lesson.id);
  const clonedLesson = store.lessons.find((item) => item.id === clonedLessonId);
  if (!clonedLesson) return undefined;
  const clonedModuleId = moduleIdMap.get(module.id);
  if (!clonedModuleId) return undefined;

  const laterLessons = store.lessons.filter(
    (item) =>
      item.moduleId === clonedModuleId && item.orderIndex > clonedLesson.orderIndex
  );
  for (const item of laterLessons) {
    item.orderIndex += 1;
  }

  const mastery =
    store.learnerMastery.find(
      (item) => item.userId === user.id && item.conceptId === concept.id
    )?.masteryScore ?? 0.35;

  const remedial: Lesson = {
    id: makeId("lesson"),
    moduleId: clonedModuleId,
    conceptId: concept.id,
    title: `Remedial Practice: ${concept.name}`,
    content: generateLesson(concept, mastery, user.preferredStyle, true),
    estimatedMinutes: 15,
    orderIndex: clonedLesson.orderIndex + 1,
    status: "not_started",
    masteryTarget: 0.75,
    whyAssigned: `Added because the last quiz score was below 60%, so ${concept.name.toLowerCase()} needs another short practice pass.`,
    isRemedial: true
  };

  store.lessons.push(remedial);
  store.learningEvents.push({
    id: makeId("event"),
    userId: user.id,
    eventType: "curriculum_version_created",
    metadata: {
      previousCurriculumId: curriculum.id,
      curriculumId: newCurriculum.id,
      version: newCurriculum.version,
      changeReason: newCurriculum.changeReason
    },
    createdAt: nowIso()
  });
  return remedial;
}
