import { getCurriculumBundle } from "@/lib/adaptive/curriculumEngine";
import { getMasteryRecordsForSubject } from "@/lib/adaptive/assessmentEngine";
import { getSubjectConcepts } from "@/lib/adaptive/subjectEngine";
import type { DashboardData, DataStore, Lesson } from "@/lib/types";

const completedStatuses = new Set(["completed", "mastered", "skipped"]);

export function getNextLesson(store: DataStore, userId: string): Lesson | undefined {
  const bundle = getCurriculumBundle(store, userId);
  if (!bundle) return undefined;

  const user = store.users.find((item) => item.id === userId);

  const allLessons = bundle.modules.flatMap((module) => module.lessons);
  const latestQuiz = store.quizAttempts
    .filter((attempt) => attempt.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (latestQuiz && latestQuiz.score < 60) {
    const failedConceptReview = allLessons.find(
      (lesson) =>
        lesson.conceptId === latestQuiz.conceptId &&
        lesson.isRemedial &&
        !completedStatuses.has(lesson.status)
    );
    if (failedConceptReview) return failedConceptReview;
  }

  const masteryMap = Object.fromEntries(
    (user
      ? getMasteryRecordsForSubject(store, userId, user.subject)
      : store.learnerMastery.filter((item) => item.userId === userId)
    ).map((item) => [item.conceptId, item.masteryScore])
  );
  const weakestConcept = Object.entries(masteryMap).sort(([, a], [, b]) => a - b)[0];

  if (weakestConcept && weakestConcept[1] < 0.5) {
    const remedial = allLessons.find(
      (lesson) =>
        lesson.conceptId === weakestConcept[0] &&
        lesson.isRemedial &&
        !completedStatuses.has(lesson.status)
    );
    if (remedial) return remedial;
  }

  return allLessons.find((lesson) => !completedStatuses.has(lesson.status));
}

export function buildDashboard(store: DataStore, userId: string): DashboardData {
  const bundle = getCurriculumBundle(store, userId);
  const user = store.users.find((item) => item.id === userId);
  const masteryRecords = user
    ? getMasteryRecordsForSubject(store, userId, user.subject)
    : store.learnerMastery.filter((item) => item.userId === userId);
  const subjectConceptIds = user
    ? new Set(getSubjectConcepts(store, user.subject).map((concept) => concept.id))
    : new Set(masteryRecords.map((record) => record.conceptId));
  const mastery = Object.fromEntries(
    masteryRecords.map((item) => [item.conceptId, item.masteryScore])
  );
  const confidence = Object.fromEntries(
    masteryRecords.map((item) => [item.conceptId, item.confidence])
  );
  const conceptName = (conceptId: string) =>
    store.concepts.find((concept) => concept.id === conceptId)?.name ?? conceptId;
  const conceptNames = Object.fromEntries(
    masteryRecords.map((record) => [record.conceptId, conceptName(record.conceptId)])
  );
  const conceptOrder = masteryRecords.map((record) => record.conceptId);

  const weakAreas = masteryRecords
    .filter((item) => item.masteryScore < 0.6)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .map((item) => conceptName(item.conceptId));
  const strongAreas = masteryRecords
    .filter((item) => item.masteryScore >= 0.8)
    .sort((a, b) => b.masteryScore - a.masteryScore)
    .map((item) => conceptName(item.conceptId));

  const modules =
    bundle?.modules.map((module) => ({
      ...module,
      completedCount: module.lessons.filter((lesson) =>
        completedStatuses.has(lesson.status)
      ).length
    })) ?? [];
  const lessons = modules.flatMap((module) => module.lessons);
  const completedLessons = lessons.filter((lesson) =>
    completedStatuses.has(lesson.status)
  ).length;
  const totalLessons = lessons.length;
  const nextLesson = getNextLesson(store, userId);
  const currentModule =
    modules.find((module) =>
      module.lessons.some((lesson) => lesson.id === nextLesson?.id)
    )?.title ??
    modules.find((module) => module.completedCount < module.lessons.length)?.title ??
    "No active module yet";

  const recentQuizScores = store.quizAttempts
    .filter((attempt) => attempt.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  const timeSpentMinutes = lessons
    .filter((lesson) => completedStatuses.has(lesson.status) && lesson.estimatedMinutes > 0)
    .reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0);

  const reviewDue = store.reviewSchedule
    .filter((review) => {
      if (review.userId !== userId || review.status === "completed") return false;
      if (!subjectConceptIds.has(review.conceptId)) return false;
      if (review.status === "due") return true;
      return completedLessons >= review.dueAfterCompletedLessons;
    })
    .map((review) => conceptName(review.conceptId));

  const needsMoreEvidence = masteryRecords
    .filter((record) => record.confidence < 0.55)
    .map((record) => conceptName(record.conceptId));

  const masteryEvidence = store.masteryEvidence
    .filter(
      (item) => item.userId === userId && subjectConceptIds.has(item.conceptId)
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  const weakest = weakAreas[0];
  const recommendedNextStep = nextLesson
    ? nextLesson.isRemedial
      ? `Review ${conceptName(nextLesson.conceptId)} before continuing.`
      : `Continue with ${nextLesson.title}.`
    : weakest
      ? `Revisit ${weakest} to keep mastery stable.`
      : totalLessons > 0
        ? "Great work. Your current path is complete."
        : "Complete the assessment to generate your first personalised path.";

  return {
    overallProgress:
      totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
    currentModule,
    completedLessons,
    totalLessons,
    weakAreas,
    strongAreas,
    recommendedNextStep,
    mastery,
    confidence,
    conceptNames,
    conceptOrder,
    needsMoreEvidence,
    reviewDue,
    masteryEvidence,
    timeSpentMinutes,
    recentQuizScores,
    modules,
    nextLesson
  };
}
