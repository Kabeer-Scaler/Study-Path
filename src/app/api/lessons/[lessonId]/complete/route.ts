import { assertOwnsUser, getAuthenticatedUser, getLessonOwnerId } from "@/lib/auth";
import { makeId, mutateStore, nowIso } from "@/lib/db/store";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  try {
    const result = await mutateStore((store) => {
      assertOwnsUser(getAuthenticatedUser(store, request), getLessonOwnerId(store, lessonId));
      const lesson = store.lessons.find((item) => item.id === lessonId);
      if (!lesson) throw new Error("Lesson not found.");
      if (lesson.status !== "mastered") {
        lesson.status = "completed";
      }
      const module = store.modules.find((item) => item.id === lesson.moduleId);
      const curriculum = module
        ? store.curricula.find((item) => item.id === module.curriculumId)
        : undefined;
      if (curriculum) {
        store.learningEvents.push({
          id: makeId("event"),
          userId: curriculum.userId,
          eventType: "lesson_completed",
          metadata: { lessonId: lesson.id, conceptId: lesson.conceptId },
          createdAt: nowIso()
        });
      }
      return lesson;
    });

    return ok({ lesson: result });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not complete lesson.");
  }
}
