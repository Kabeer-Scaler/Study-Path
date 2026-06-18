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
      <main className="compact-page-shell app-page">
        <div className="panel p-4">User not found.</div>
      </main>
    );
  }

  if (!bundle) {
    return (
      <main className="compact-page-shell app-page">
        <div className="panel flex flex-1 flex-col items-center justify-center p-6 text-center">
          <h1 className="text-xl font-extrabold text-ink">No curriculum found</h1>
          <p className="mt-1 text-sm text-muted">Please complete the assessment first.</p>
          <Link className="accent-button mx-auto mt-4 inline-flex" href="/onboarding">
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
    <main className="compact-page-shell app-page animate-fade-in">
      <div className="page-header-compact">
        <div>
          <span className="chip-accent">
            <Sparkles size={14} aria-hidden /> {user.subject}
          </span>
          <h1 className="mt-1">{bundle.curriculum.title}</h1>
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

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="panel flex min-h-0 flex-col p-4 sm:p-5">
          <div className="flex shrink-0 items-center gap-2">
            <BookOpenCheck size={20} className="text-accent" aria-hidden />
            <h2 className="text-lg font-bold text-ink">Learning path map</h2>
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            <CurriculumMap modules={bundle.modules} />
          </div>
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden">
          <CurriculumLessonList modules={bundle.modules} />
        </aside>
      </div>
    </main>
  );
}
