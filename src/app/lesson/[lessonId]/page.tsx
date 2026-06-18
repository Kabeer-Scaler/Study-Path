import { LessonExperience } from "@/components/LessonExperience";
import { findAuthenticatedUser, getLessonOwnerId, SESSION_COOKIE } from "@/lib/auth";
import { readStore } from "@/lib/db/store";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const store = await readStore();
  const authUser = findAuthenticatedUser(store, (await cookies()).get(SESSION_COOKIE)?.value ?? "");
  if (!authUser) redirect("/login");
  if (authUser.id !== getLessonOwnerId(store, lessonId)) redirect(`/dashboard/${authUser.id}`);
  const lesson = store.lessons.find((item) => item.id === lessonId);

  if (!lesson) {
    return (
      <main className="page-shell">
        <div className="panel p-6">Lesson not found.</div>
      </main>
    );
  }

  const module = store.modules.find((item) => item.id === lesson.moduleId);
  const curriculum = module
    ? store.curricula.find((item) => item.id === module.curriculumId)
    : undefined;
  const user = curriculum
    ? store.users.find((item) => item.id === curriculum.userId)
    : undefined;
  const concept = store.concepts.find((item) => item.id === lesson.conceptId);
  const mastery =
    store.learnerMastery.find(
      (item) => item.userId === user?.id && item.conceptId === lesson.conceptId
    )?.masteryScore ?? 0.3;

  return (
    <LessonExperience
      payload={{
        lesson,
        module,
        user,
        concept,
        mastery,
        tutorMessages: store.tutorMessages.filter(
          (item) => item.userId === user?.id && item.lessonId === lesson.id
        )
      }}
    />
  );
}
