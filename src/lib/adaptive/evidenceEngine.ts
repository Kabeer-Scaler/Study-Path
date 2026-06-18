import { makeId, nowIso } from "@/lib/db/store";
import type { DataStore, MasteryEvidence, ReviewSchedule } from "@/lib/types";

export function recordMasteryEvidence(
  store: DataStore,
  evidence: Omit<MasteryEvidence, "id" | "createdAt">
) {
  store.masteryEvidence.push({
    id: makeId("evidence"),
    createdAt: nowIso(),
    ...evidence
  });
}

export function countCompletedLessons(store: DataStore, userId: string) {
  const curriculumIds = new Set(
    store.curricula
      .filter((curriculum) => curriculum.userId === userId && curriculum.isLatest)
      .map((curriculum) => curriculum.id)
  );
  const moduleIds = new Set(
    store.modules
      .filter((module) => curriculumIds.has(module.curriculumId))
      .map((module) => module.id)
  );

  return store.lessons.filter(
    (lesson) =>
      moduleIds.has(lesson.moduleId) &&
      ["completed", "mastered", "skipped"].includes(lesson.status)
  ).length;
}

export function upsertReviewSchedule(
  store: DataStore,
  {
    userId,
    conceptId,
    mastery,
    improved
  }: {
    userId: string;
    conceptId: string;
    mastery: number;
    improved: boolean;
  }
) {
  const conceptName =
    store.concepts.find((concept) => concept.id === conceptId)?.name ?? conceptId;
  const completed = countCompletedLessons(store, userId);
  const existing = store.reviewSchedule.find(
    (item) =>
      item.userId === userId &&
      item.conceptId === conceptId &&
      item.status !== "completed"
  );

  if (mastery < 0.6) {
    const reason = `Review due because ${conceptName} mastery is ${Math.round(mastery * 100)}%.`;
    if (existing) {
      existing.reason = reason;
      existing.status = "due";
      existing.dueAfterCompletedLessons = completed;
      existing.updatedAt = nowIso();
      return existing;
    }
    const review: ReviewSchedule = {
      id: makeId("review"),
      userId,
      conceptId,
      reason,
      dueAfterCompletedLessons: completed,
      status: "due",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.reviewSchedule.push(review);
    return review;
  }

  if (improved && mastery < 0.8) {
    const reason = `Schedule a spaced review because ${conceptName} recently improved but is not stable yet.`;
    const dueAfterCompletedLessons = completed + 2;
    if (existing) {
      existing.reason = reason;
      existing.status = "scheduled";
      existing.dueAfterCompletedLessons = dueAfterCompletedLessons;
      existing.updatedAt = nowIso();
      return existing;
    }
    const review: ReviewSchedule = {
      id: makeId("review"),
      userId,
      conceptId,
      reason,
      dueAfterCompletedLessons,
      status: "scheduled",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.reviewSchedule.push(review);
    return review;
  }

  return undefined;
}
