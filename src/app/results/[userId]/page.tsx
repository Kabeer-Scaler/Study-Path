import Link from "next/link";
import { ArrowLeft, Gauge } from "lucide-react";
import { GenerateCurriculumButton } from "@/components/GenerateCurriculumButton";
import { MasteryChart } from "@/components/MasteryChart";
import { findAuthenticatedUser, SESSION_COOKIE } from "@/lib/auth";
import { readStore } from "@/lib/db/store";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const store = await readStore();
  const authUser = findAuthenticatedUser(store, (await cookies()).get(SESSION_COOKIE)?.value ?? "");
  if (!authUser) redirect("/login");
  if (authUser.id !== userId) redirect(`/results/${authUser.id}`);
  const user = store.users.find((item) => item.id === userId);

  if (!user) {
    return (
      <main className="page-shell">
        <div className="panel p-6">User not found.</div>
      </main>
    );
  }

  const masteryRecords = store.learnerMastery.filter((item) => item.userId === userId);
  const mastery = Object.fromEntries(
    masteryRecords.map((item) => [item.conceptId, item.masteryScore])
  );
  const withNames = masteryRecords.map((record) => ({
    ...record,
    conceptName:
      store.concepts.find((concept) => concept.id === record.conceptId)?.name ??
      record.conceptId
  }));
  const conceptNames = Object.fromEntries(
    withNames.map((record) => [record.conceptId, record.conceptName])
  );
  const conceptOrder = withNames.map((record) => record.conceptId);
  const weakAreas = withNames
    .filter((record) => record.masteryScore < 0.6)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 4);
  const strengths = withNames
    .filter((record) => record.masteryScore >= 0.75)
    .sort((a, b) => b.masteryScore - a.masteryScore);

  return (
    <main className="page-shell">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-700">Assessment results</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {user.name}'s mastery diagnosis
          </h1>
          <p className="mt-2 text-slate-600">
            Scores below 75% are included in the generated curriculum; scores above
            85% are skipped or treated as optional review.
          </p>
        </div>
        <Link className="secondary-button" href="/onboarding">
          <ArrowLeft size={18} aria-hidden />
          New learner
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="panel p-5">
          <div className="flex items-center gap-2">
            <Gauge size={22} className="text-teal-700" aria-hidden />
            <h2 className="text-xl font-bold">Mastery by Concept</h2>
          </div>
          <div className="mt-5">
            <MasteryChart
              mastery={mastery}
              conceptNames={conceptNames}
              conceptOrder={conceptOrder}
            />
          </div>
        </section>

        <aside className="space-y-5">
          <section className="panel p-5">
            <h2 className="text-xl font-bold">Weak Areas</h2>
            <div className="mt-3 space-y-2">
              {weakAreas.map((area) => (
                <div key={area.conceptId} className="rounded-md bg-amber-50 p-3">
                  <p className="font-semibold text-amber-950">{area.conceptName}</p>
                  <p className="text-sm text-amber-900">
                    {Math.round(area.masteryScore * 100)}% mastery
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="panel p-5">
            <h2 className="text-xl font-bold">Strengths</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {strengths.length ? (
                strengths.map((area) => (
                  <span
                    key={area.conceptId}
                    className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800"
                  >
                    {area.conceptName}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-600">
                  Strengths will appear as mastery rises.
                </p>
              )}
            </div>
          </section>
          <section className="panel p-5">
            <h2 className="text-xl font-bold">Next Step</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Generate a curriculum ordered by prerequisites, with review lessons for
              weak concepts and skipped basics when mastery is high.
            </p>
            <div className="mt-4">
              <GenerateCurriculumButton userId={user.id} />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
