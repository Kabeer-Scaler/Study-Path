import { assertOwnsUser, getAuthenticatedUser } from "@/lib/auth";
import { mutateStore } from "@/lib/db/store";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    await mutateStore((store) => {
      assertOwnsUser(getAuthenticatedUser(store, request), userId);
      const sessionIds = new Set(
        store.assessmentSessions
          .filter((session) => session.userId === userId)
          .map((session) => session.id)
      );
      const curriculumIds = new Set(
        store.curricula
          .filter((curriculum) => curriculum.userId === userId)
          .map((curriculum) => curriculum.id)
      );
      const moduleIds = new Set(
        store.modules
          .filter((module) => curriculumIds.has(module.curriculumId))
          .map((module) => module.id)
      );

      store.users = store.users.filter((user) => user.id !== userId);
      store.assessmentSessions = store.assessmentSessions.filter(
        (session) => session.userId !== userId
      );
      store.assessmentAnswers = store.assessmentAnswers.filter(
        (answer) => !sessionIds.has(answer.sessionId)
      );
      store.learnerMastery = store.learnerMastery.filter(
        (mastery) => mastery.userId !== userId
      );
      store.curricula = store.curricula.filter(
        (curriculum) => curriculum.userId !== userId
      );
      store.modules = store.modules.filter(
        (module) => !curriculumIds.has(module.curriculumId)
      );
      store.lessons = store.lessons.filter(
        (lesson) => !moduleIds.has(lesson.moduleId)
      );
      store.quizAttempts = store.quizAttempts.filter(
        (attempt) => attempt.userId !== userId
      );
      store.tutorMessages = store.tutorMessages.filter(
        (message) => message.userId !== userId
      );
      store.learningEvents = store.learningEvents.filter(
        (event) => event.userId !== userId
      );
      store.masteryEvidence = store.masteryEvidence.filter(
        (event) => event.userId !== userId
      );
      store.reviewSchedule = store.reviewSchedule.filter(
        (review) => review.userId !== userId
      );
    });
    return ok({ reset: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not reset learner.");
  }
}
