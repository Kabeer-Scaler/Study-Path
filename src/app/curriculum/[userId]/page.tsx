import Link from "next/link";
import { ArrowRight, BookOpenCheck, LayoutDashboard, Sparkles } from "lucide-react";
import { CurriculumMap } from "@/components/CurriculumMap";
import { CurriculumLessonList } from "@/components/CurriculumLessonList";
import { getCurriculumBundle } from "@/lib/adaptive/curriculumEngine";
import { findAuthenticatedUser, SESSION_COOKIE } from "@/lib/auth";
import { readStore } from "@/lib/db/store";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CurriculumPage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const store = await readStore();
  const authUser = findAuthenticatedUser(store, (await cookies()).get(SESSION_COOKIE)?.value ?? "");
  if (!authUser) redirect("/login");
  if (authUser.id !== userId) redirect(`/curriculum/${authUser.id}`);
  const user = store.users.find((item) => item.id === userId);
  const bundle = getCurriculumBundle(store, userId);

  if (!user) {
    return (
      <main className="page-shell">
        <div className="panel p-6">User not found.</div>
      </main>
    );
  }

  if (!bundle) {
    return (
      <main className="page-shell">
        <div className="panel p-8 text-center">
          <h1 className="text-2xl font-extrabold text-ink">No curriculum found</h1>
          <p className="mt-2 text-muted">Please complete the assessment first.</p>
          <Link className="accent-button mx-auto mt-5 inline-flex" href="/onboarding">
            Start assessment
          </Link>
        </div>
      </main>
    );
  }

  const firstOpenLesson = bundle.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => !["completed", "mastered", "skipped"].includes(lesson.status));

  return (
    <main className="page-shell animate-fade-in">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="chip-accent">
            <Sparkles size={14} aria-hidden /> {user.subject}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {bundle.curriculum.title}
          </h1>
          <p className="mt-2 max-w-3xl text-muted">{bundle.curriculum.generatedReason}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="secondary-button" href={`/dashboard/${user.id}`}>
            <LayoutDashboard size={18} aria-hidden />
            Dashboard
          </Link>
          {firstOpenLesson ? (
            <Link className="accent-button" href={`/lesson/${firstOpenLesson.id}`}>
              Continue
              <ArrowRight size={18} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <BookOpenCheck size={22} className="text-accent" aria-hidden />
            <h2 className="text-xl font-bold text-ink">Learning path map</h2>
          </div>
          <div className="mt-5">
            <CurriculumMap modules={bundle.modules} />
          </div>
        </section>

        <aside>
          <CurriculumLessonList modules={bundle.modules} />
        </aside>
      </div>
    </main>
  );
}
