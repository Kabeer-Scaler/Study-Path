import { assertOwnsUser, getAuthenticatedUser, getLessonOwnerId } from "@/lib/auth";
import { readStore } from "@/lib/db/store";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const store = await readStore();
  const lesson = store.lessons.find((item) => item.id === lessonId);
  if (!lesson) return fail("Lesson not found.", 404);
  try {
    assertOwnsUser(getAuthenticatedUser(store, request), getLessonOwnerId(store, lessonId));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unauthorized.", 401);
  }

  const module = store.modules.find((item) => item.id === lesson.moduleId);
  const curriculum = module
    ? store.curricula.find((item) => item.id === module.curriculumId)
    : undefined;
  const user = curriculum
    ? store.users.find((item) => item.id === curriculum.userId)
    : undefined;
  const concept = store.concepts.find((item) => item.id === lesson.conceptId);
  const mastery = store.learnerMastery.find(
    (item) => item.userId === user?.id && item.conceptId === lesson.conceptId
  );

  return ok({
    lesson,
    module,
    curriculum,
    user: user
      ? { id: user.id, email: user.email, name: user.name, subject: user.subject }
      : undefined,
    concept,
    mastery: mastery?.masteryScore ?? 0.3,
    tutorMessages: store.tutorMessages.filter(
      (item) => item.lessonId === lesson.id && item.userId === user?.id
    )
  });
}
