import Link from "next/link";
import { ArrowLeft, Gauge, Sparkles } from "lucide-react";
import { GenerateCurriculumButton } from "@/components/GenerateCurriculumButton";
import { MasteryChart } from "@/components/MasteryChart";
import { findAuthenticatedUser, SESSION_COOKIE } from "@/lib/auth";
import { getMasteryRecordsForSubject } from "@/lib/adaptive/assessmentEngine";
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
      <main className="compact-page-shell app-page">
        <div className="panel p-4">User not found.</div>
      </main>
    );
  }

  const masteryRecords = getMasteryRecordsForSubject(store, userId, user.subject);
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
    <main className="compact-page-shell app-page animate-fade-in overflow-hidden">
      <div className="page-header-compact shrink-0">
        <div>
          <span className="chip-accent">
            <Sparkles size={14} aria-hidden /> Assessment results
          </span>
          <h1 className="mt-1">{user.name}'s mastery diagnosis</h1>
          <p className="hidden max-w-2xl text-sm text-muted sm:block">
            Scores below 75% feed your curriculum; above 85% may be skipped.
          </p>
        </div>
        <Link className="secondary-button shrink-0" href="/onboarding">
          <ArrowLeft size={18} aria-hidden />
          New learner
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="panel p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Gauge size={20} className="text-accent" aria-hidden />
            <h2 className="text-lg font-bold text-ink">Mastery by concept</h2>
          </div>
          <div className="mt-3">
            <MasteryChart
              mastery={mastery}
              conceptNames={conceptNames}
              conceptOrder={conceptOrder}
              compact
            />
          </div>
        </section>

        <aside className="panel flex min-h-0 flex-col overflow-hidden p-4 sm:p-5">
          <h2 className="shrink-0 text-lg font-bold text-ink">Insights</h2>
          <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain">
            <div>
              <h3 className="text-sm font-bold text-ink">Weak areas</h3>
              <div className="mt-1.5 space-y-1.5">
                {weakAreas.length ? (
                  weakAreas.map((area) => (
                    <div
                      key={area.conceptId}
                      className="rounded-lg border border-powder-blush/50 bg-powder-blush/15 px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-ink">{area.conceptName}</p>
                      <p className="text-xs text-ink/80">
                        {Math.round(area.masteryScore * 100)}% mastery
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">No weak areas — nice work.</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Strengths</h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {strengths.length ? (
                  strengths.map((area) => (
                    <span key={area.conceptId} className="chip-highlight">
                      {area.conceptName}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted">Strengths appear as mastery rises.</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 shrink-0 border-t border-line/60 bg-surface pt-3">
            <h3 className="text-sm font-bold text-ink">Next step</h3>
            <p className="mt-1 text-xs leading-5 text-muted">
              Generate a curriculum ordered by prerequisites and weak areas.
            </p>
            <div className="mt-2">
              <GenerateCurriculumButton userId={user.id} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
