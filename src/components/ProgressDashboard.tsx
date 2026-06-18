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
    <main className="page-shell animate-fade-in">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="chip-accent">
            <Sparkles size={14} aria-hidden /> {user.subject}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {user.name}'s progress dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-muted">{dashboard.recommendedNextStep}</p>
        </div>
        {dashboard.nextLesson ? (
          <Link className="accent-button" href={`/lesson/${dashboard.nextLesson.id}`}>
            Continue learning
            <ArrowRight size={18} aria-hidden />
          </Link>
        ) : (
          <Link className="secondary-button" href={`/curriculum/${user.id}`}>
            View curriculum
          </Link>
        )}
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          index={0}
          icon={<Target size={20} aria-hidden />}
          label="Overall progress"
          accent="bg-powder-blush/30"
          big={
            <>
              <CountUp value={dashboard.overallProgress} />%
            </>
          }
        >
          <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-powder-blush via-icy-aqua to-light-blue transition-all duration-1000 ease-out"
              style={{ width: progressMounted ? `${dashboard.overallProgress}%` : "0%" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{
                animation: "progress-sweep 2.4s ease-in-out infinite",
                mixBlendMode: "overlay"
              }}
            />
          </div>
        </MetricCard>
        <MetricCard
          index={1}
          icon={<ListChecks size={20} aria-hidden />}
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
          icon={<Clock size={20} aria-hidden />}
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
          icon={<Trophy size={20} aria-hidden />}
          label="Current module"
          accent="bg-vanilla-cream/60"
          big={
            <span className="text-lg leading-snug">{dashboard.currentModule}</span>
          }
        />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="panel p-5 sm:p-6">
            <h2 className="text-xl font-bold text-ink">Visual learning path</h2>
            {dashboard.modules.length ? (
              <div className="mt-5">
                <CurriculumMap modules={dashboard.modules} />
              </div>
            ) : (
              <p className="mt-3 text-muted">Start your first lesson to see progress here.</p>
            )}
          </div>
          <div className="panel p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-ink">Recent quiz scores</h2>
              {dashboard.recentQuizScores.length ? (
                <div className="w-full sm:w-64">
                  <Dropdown
                    options={SORT_OPTIONS}
                    value={sortKey}
                    onChange={(value) => setSortKey(value as SortKey)}
                  />
                </div>
              ) : null}
            </div>
            {sortedScores.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-line text-muted">
                    <tr>
                      <th className="py-2 font-semibold">Date</th>
                      <th className="py-2 font-semibold">Concept</th>
                      <th className="py-2 font-semibold">Score</th>
                      <th className="py-2 font-semibold">Correct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedScores.map((attempt) => (
                      <tr key={attempt.id} className="border-b border-line/60 last:border-0">
                        <td className="py-2.5 text-muted">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 text-ink">{attempt.conceptId}</td>
                        <td className="py-2.5">
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
                        <td className="py-2.5 text-muted">
                          {attempt.correctAnswers}/{attempt.totalQuestions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-muted">No quiz attempts yet.</p>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="panel p-5 sm:p-6">
            <h2 className="text-xl font-bold text-ink">Mastery by concept</h2>
            <div className="mt-4">
              <MasteryChart
                mastery={dashboard.mastery}
                conceptNames={dashboard.conceptNames}
                conceptOrder={dashboard.conceptOrder}
                compact
              />
            </div>
          </div>
          <AreaCard title="Weak areas" items={dashboard.weakAreas} tone="accent" empty="No weak areas right now." />
          <AreaCard title="Needs more evidence" items={dashboard.needsMoreEvidence} tone="secondary" empty="Confidence is stable for current scores." />
          <AreaCard title="Review due" items={dashboard.reviewDue} tone="accent" empty="No spaced reviews are due yet." />
          <AreaCard title="Strong areas" items={dashboard.strongAreas} tone="highlight" empty="Strengths appear after assessment." />

          <div className="panel p-5 sm:p-6">
            <h2 className="text-xl font-bold text-ink">Learning evidence</h2>
            {dashboard.masteryEvidence.length ? (
              <div className="mt-3 space-y-3">
                {dashboard.masteryEvidence.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-line bg-surface-muted p-3"
                  >
                    <p className="text-sm font-semibold text-ink">
                      {item.conceptId}: {Math.round(item.previousMastery * 100)}% →{" "}
                      {Math.round(item.newMastery * 100)}%
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">{item.reason}</p>
                    {item.misconception ? (
                      <p className="mt-1 text-xs leading-5 text-accent">
                        Misconception: {item.misconception}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Evidence appears after assessment or quizzes.
              </p>
            )}
          </div>
          <div className="panel p-5 sm:p-6">
            <h2 className="text-xl font-bold text-ink">Privacy</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              The app stores only learning-related profile, assessment, lesson,
              quiz, and tutor records.
            </p>
            <div className="mt-4">
              <ResetLearnerButton userId={user.id} />
            </div>
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
      className="panel panel-hover relative overflow-hidden p-5 animate-stagger-fade"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${accent} blur-2xl`} />
      <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-powder-blush/40 to-icy-aqua/40 text-ink shadow-soft">
        {icon}
      </span>
      <p className="mt-3 text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-ink">{big}</p>
      {children}
    </div>
  );
}

function AreaCard({
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
    <div className="panel p-5 sm:p-6">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
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
