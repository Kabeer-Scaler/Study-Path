"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  ListChecks,
  Sparkles,
  Target,
  Trophy
} from "lucide-react";
import { CurriculumMap } from "@/components/CurriculumMap";
import { Dropdown } from "@/components/Dropdown";
import { MasteryChart } from "@/components/MasteryChart";
import { ResetLearnerButton } from "@/components/ResetLearnerButton";
import { CountUp } from "@/components/CountUp";
import type { DashboardData, User } from "@/lib/types";

type SortKey = "recent" | "score-desc" | "score-asc";

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent", description: "Newest attempts first" },
  { value: "score-desc", label: "Score, high → low", description: "Top scores first" },
  { value: "score-asc", label: "Score, low → high", description: "Spot weak areas" }
];

export function ProgressDashboard({
  user,
  dashboard
}: {
  user: User;
  dashboard: DashboardData;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [progressMounted, setProgressMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setProgressMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const sortedScores = useMemo(() => {
    const items = [...dashboard.recentQuizScores];
    if (sortKey === "score-desc") items.sort((a, b) => b.score - a.score);
    else if (sortKey === "score-asc") items.sort((a, b) => a.score - b.score);
    else
      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return items;
  }, [dashboard.recentQuizScores, sortKey]);

  return (
    <main className="compact-page-shell app-page animate-fade-in">
      <div className="page-header-compact">
        <div className="min-w-0">
          <span className="chip-accent">
            <Sparkles size={14} aria-hidden /> {user.subject}
          </span>
          <h1 className="mt-1 truncate">{user.name}'s progress dashboard</h1>
          <p className="mt-0.5 truncate text-sm text-muted">{dashboard.recommendedNextStep}</p>
        </div>
        {dashboard.nextLesson ? (
          <Link className="accent-button shrink-0" href={`/lesson/${dashboard.nextLesson.id}`}>
            Continue learning
            <ArrowRight size={18} aria-hidden />
          </Link>
        ) : (
          <Link className="secondary-button shrink-0" href={`/curriculum/${user.id}`}>
            View curriculum
          </Link>
        )}
      </div>

      <section className="grid shrink-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          index={0}
          icon={<Target size={18} aria-hidden />}
          label="Overall progress"
          accent="bg-powder-blush/30"
          big={
            <>
              <CountUp value={dashboard.overallProgress} />%
            </>
          }
        >
          <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent transition-all duration-1000 ease-out"
              style={{ width: progressMounted ? `${dashboard.overallProgress}%` : "0%" }}
            />
          </div>
        </MetricCard>
        <MetricCard
          index={1}
          icon={<ListChecks size={18} aria-hidden />}
          label="Completed lessons"
          accent="bg-icy-aqua/30"
          big={
            <>
              <CountUp value={dashboard.completedLessons} />/{dashboard.totalLessons}
            </>
          }
        />
        <MetricCard
          index={2}
          icon={<Clock size={18} aria-hidden />}
          label="Time spent"
          accent="bg-light-blue/30"
          big={
            <>
              <CountUp value={dashboard.timeSpentMinutes} />m
            </>
          }
        />
        <MetricCard
          index={3}
          icon={<Trophy size={18} aria-hidden />}
          label="Current module"
          accent="bg-vanilla-cream/60"
          big={
            <span className="truncate text-lg leading-snug">{dashboard.currentModule}</span>
          }
        />
      </section>

      <section className="mt-2 grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="panel flex min-h-0 flex-col overflow-hidden p-4 sm:p-5">
          <h2 className="shrink-0 text-lg font-bold text-ink">Visual learning path</h2>
          {dashboard.modules.length ? (
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
              <CurriculumMap modules={dashboard.modules} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">Start your first lesson to see progress here.</p>
          )}
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <div className="panel flex shrink-0 flex-col overflow-hidden p-4 sm:p-5">
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-ink">Recent quiz scores</h2>
              {dashboard.recentQuizScores.length ? (
                <div className="w-full sm:w-56">
                  <Dropdown
                    options={SORT_OPTIONS}
                    value={sortKey}
                    onChange={(value) => setSortKey(value as SortKey)}
                  />
                </div>
              ) : null}
            </div>
            {sortedScores.length ? (
              <div className="mt-2 max-h-[9.5rem] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-line bg-surface/95 text-muted backdrop-blur-sm">
                    <tr>
                      <th className="py-1.5 font-semibold">Date</th>
                      <th className="py-1.5 font-semibold">Concept</th>
                      <th className="py-1.5 font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedScores.map((attempt) => (
                      <tr key={attempt.id} className="border-b border-line/60 last:border-0">
                        <td className="py-1.5 text-muted">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-1.5 text-ink">
                          {dashboard.conceptNames[attempt.conceptId] ?? attempt.conceptId}
                        </td>
                        <td className="py-1.5">
                          <span
                            className={`chip ${
                              attempt.score >= 80
                                ? "chip-highlight"
                                : attempt.score >= 60
                                  ? "chip-secondary"
                                  : "chip-accent"
                            }`}
                          >
                            {attempt.score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">No quiz attempts yet.</p>
            )}
          </div>
          <div className="panel p-4 sm:p-5">
            <h2 className="text-lg font-bold text-ink">Mastery by concept</h2>
            <div className="mt-2">
              <MasteryChart
                mastery={dashboard.mastery}
                conceptNames={dashboard.conceptNames}
                conceptOrder={dashboard.conceptOrder}
                compact
              />
            </div>
          </div>
          <div className="panel p-4 sm:p-5">
            <h2 className="text-lg font-bold text-ink">Learning insights</h2>
            <div className="mt-2 space-y-3">
              <InsightSection
                title="Weak areas"
                items={dashboard.weakAreas}
                tone="accent"
                empty="No weak areas right now."
              />
              <InsightSection
                title="Needs more evidence"
                items={dashboard.needsMoreEvidence}
                tone="secondary"
                empty="Confidence is stable for current scores."
              />
              <InsightSection
                title="Review due"
                items={dashboard.reviewDue}
                tone="accent"
                empty="No spaced reviews are due yet."
              />
              <InsightSection
                title="Strong areas"
                items={dashboard.strongAreas}
                tone="highlight"
                empty="Strengths appear after assessment."
              />
            </div>
          </div>
          <div className="panel p-4 sm:p-5">
            <h2 className="text-lg font-bold text-ink">Learning evidence</h2>
            {dashboard.masteryEvidence.length ? (
              <div className="mt-2 space-y-2">
                {dashboard.masteryEvidence.slice(0, 3).map((item) => {
                  const name =
                    dashboard.conceptNames[item.conceptId] ?? item.conceptId;
                  const previous = Math.round(item.previousMastery * 100);
                  const next = Math.round(item.newMastery * 100);
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-line bg-surface-muted p-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-ink">{name}</p>
                        <span className="chip-secondary shrink-0 tabular-nums text-[0.65rem]">
                          {previous}% → {next}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-4 text-muted">{item.reason}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Evidence appears after assessment or quizzes.
              </p>
            )}
          </div>
          <div className="panel flex shrink-0 items-center justify-between gap-3 p-4">
            <p className="text-xs text-muted">Learning data only · no extra profile info stored.</p>
            <ResetLearnerButton userId={user.id} />
          </div>
        </aside>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  big,
  accent,
  children,
  index = 0
}: {
  icon: React.ReactNode;
  label: string;
  big: React.ReactNode;
  accent: string;
  children?: React.ReactNode;
  index?: number;
}) {
  return (
    <div
      className="panel relative flex items-start gap-3 overflow-hidden px-3 pb-2.5 pt-2.5 animate-stagger-fade"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={`pointer-events-none absolute -right-6 -top-6 h-14 w-14 rounded-full ${accent} blur-2xl`} />
      <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-highlight/25 text-accent shadow-soft">
        {icon}
      </span>
      <div className="relative min-w-0 flex-1">
        <p className="text-xs font-semibold leading-none text-muted">{label}</p>
        <p className="mt-1 text-2xl font-extrabold leading-none tracking-tight text-ink">{big}</p>
        {children}
      </div>
    </div>
  );
}

function InsightSection({
  title,
  items,
  tone,
  empty
}: {
  title: string;
  items: string[];
  tone: "accent" | "highlight" | "secondary";
  empty: string;
}) {
  const chipClass =
    tone === "accent" ? "chip-accent" : tone === "highlight" ? "chip-highlight" : "chip-secondary";
  return (
    <div>
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length ? (
          items.map((area) => (
            <span key={area} className={chipClass}>
              {area}
            </span>
          ))
        ) : (
          <p className="text-sm text-muted">{empty}</p>
        )}
      </div>
    </div>
  );
}
