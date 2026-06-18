import Link from "next/link";
import { ArrowRight, BookOpenCheck, LayoutDashboard } from "lucide-react";
import { CurriculumMap } from "@/components/CurriculumMap";
import { StatusBadge } from "@/components/StatusBadge";
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
        <div className="panel p-6">
          <h1 className="text-2xl font-bold">No curriculum found</h1>
          <p className="mt-2 text-slate-600">Please complete the assessment first.</p>
          <Link className="primary-button mt-5" href="/onboarding">
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
    <main className="page-shell">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-700">{user.subject}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {bundle.curriculum.title}
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            {bundle.curriculum.generatedReason}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="secondary-button" href={`/dashboard/${user.id}`}>
            <LayoutDashboard size={18} aria-hidden />
            Dashboard
          </Link>
          {firstOpenLesson ? (
            <Link className="primary-button" href={`/lesson/${firstOpenLesson.id}`}>
              Continue
              <ArrowRight size={18} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="panel p-5">
          <div className="flex items-center gap-2">
            <BookOpenCheck size={22} className="text-teal-700" aria-hidden />
            <h2 className="text-xl font-bold">Learning Path Map</h2>
          </div>
          <div className="mt-5">
            <CurriculumMap modules={bundle.modules} />
          </div>
        </section>

        <aside className="space-y-4">
          {bundle.modules.map((module) => (
            <section key={module.id} className="panel p-4">
              <h2 className="font-bold text-slate-950">{module.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{module.reason}</p>
              <div className="mt-4 space-y-3">
                {module.lessons.map((lesson) => (
                  <div key={lesson.id} className="border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        className="font-semibold text-teal-800 hover:text-teal-950"
                        href={`/lesson/${lesson.id}`}
                      >
                        {lesson.title}
                      </Link>
                      <StatusBadge status={lesson.status} />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Why this lesson? {lesson.whyAssigned}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </aside>
      </div>
    </main>
  );
}
