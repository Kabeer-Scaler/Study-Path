import Link from "next/link";
import { ArrowLeft, Gauge, Sparkles } from "lucide-react";
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
    <main className="page-shell animate-fade-in">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="chip-accent">
            <Sparkles size={14} aria-hidden /> Assessment results
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {user.name}'s mastery diagnosis
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
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
        <section className="panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Gauge size={22} className="text-accent" aria-hidden />
            <h2 className="text-xl font-bold text-ink">Mastery by concept</h2>
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
          <section className="panel p-5 sm:p-6">
            <h2 className="text-xl font-bold text-ink">Weak areas</h2>
            <div className="mt-3 space-y-2">
              {weakAreas.length ? (
                weakAreas.map((area) => (
                  <div
                    key={area.conceptId}
                    className="rounded-xl border border-powder-blush/50 bg-powder-blush/15 p-3"
                  >
                    <p className="font-semibold text-ink">{area.conceptName}</p>
                    <p className="text-sm text-ink/80">
                      {Math.round(area.masteryScore * 100)}% mastery
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No weak areas — nice work.</p>
              )}
            </div>
          </section>
          <section className="panel p-5 sm:p-6">
            <h2 className="text-xl font-bold text-ink">Strengths</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {strengths.length ? (
                strengths.map((area) => (
                  <span key={area.conceptId} className="chip-highlight">
                    {area.conceptName}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted">
                  Strengths will appear as mastery rises.
                </p>
              )}
            </div>
          </section>
          <section className="gradient-card">
            <h2 className="text-xl font-bold text-ink">Next step</h2>
            <p className="mt-2 text-sm leading-6 text-ink/85">
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
