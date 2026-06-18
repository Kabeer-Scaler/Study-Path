import Link from "next/link";
import { ArrowRight, Clock, ListChecks, Target, Trophy } from "lucide-react";
import { CurriculumMap } from "@/components/CurriculumMap";
import { MasteryChart } from "@/components/MasteryChart";
import { ResetLearnerButton } from "@/components/ResetLearnerButton";
import type { DashboardData, User } from "@/lib/types";

export function ProgressDashboard({
  user,
  dashboard
}: {
  user: User;
  dashboard: DashboardData;
}) {
  return (
    <main className="page-shell">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-700">{user.subject}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {user.name}'s progress dashboard
          </h1>
          <p className="mt-2 text-slate-600">{dashboard.recommendedNextStep}</p>
        </div>
        {dashboard.nextLesson ? (
          <Link className="primary-button" href={`/lesson/${dashboard.nextLesson.id}`}>
            Continue learning
            <ArrowRight size={18} aria-hidden />
          </Link>
        ) : (
          <Link className="secondary-button" href={`/curriculum/${user.id}`}>
            View curriculum
          </Link>
        )}
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="panel p-4">
          <Target size={20} className="text-teal-700" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-slate-600">Overall progress</p>
          <p className="mt-1 text-3xl font-bold">{dashboard.overallProgress}%</p>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600"
              style={{ width: `${dashboard.overallProgress}%` }}
            />
          </div>
        </div>
        <div className="panel p-4">
          <ListChecks size={20} className="text-indigo-700" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-slate-600">Completed lessons</p>
          <p className="mt-1 text-3xl font-bold">
            {dashboard.completedLessons}/{dashboard.totalLessons}
          </p>
        </div>
        <div className="panel p-4">
          <Clock size={20} className="text-amber-700" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-slate-600">Time spent</p>
          <p className="mt-1 text-3xl font-bold">{dashboard.timeSpentMinutes}m</p>
        </div>
        <div className="panel p-4">
          <Trophy size={20} className="text-[var(--coral)]" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-slate-600">Current module</p>
          <p className="mt-1 text-lg font-bold leading-snug">{dashboard.currentModule}</p>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="panel p-5">
            <h2 className="text-xl font-bold">Visual Learning Path</h2>
            {dashboard.modules.length ? (
              <div className="mt-5">
                <CurriculumMap modules={dashboard.modules} />
              </div>
            ) : (
              <p className="mt-3 text-slate-600">Start your first lesson to see progress here.</p>
            )}
          </div>
          <div className="panel p-5">
            <h2 className="text-xl font-bold">Recent Quiz Scores</h2>
            {dashboard.recentQuizScores.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2">Date</th>
                      <th className="py-2">Concept</th>
                      <th className="py-2">Score</th>
                      <th className="py-2">Correct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentQuizScores.map((attempt) => (
                      <tr key={attempt.id} className="border-b border-slate-100">
                        <td className="py-2">{new Date(attempt.createdAt).toLocaleDateString()}</td>
                        <td className="py-2">{attempt.conceptId}</td>
                        <td className="py-2 font-semibold">{attempt.score}%</td>
                        <td className="py-2">
                          {attempt.correctAnswers}/{attempt.totalQuestions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-slate-600">No quiz attempts yet.</p>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="panel p-5">
            <h2 className="text-xl font-bold">Mastery by Concept</h2>
            <div className="mt-4">
              <MasteryChart
                mastery={dashboard.mastery}
                conceptNames={dashboard.conceptNames}
                conceptOrder={dashboard.conceptOrder}
                compact
              />
            </div>
          </div>
          <div className="panel p-5">
            <h2 className="text-xl font-bold">Weak Areas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {dashboard.weakAreas.length ? (
                dashboard.weakAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900"
                  >
                    {area}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-600">No weak areas right now.</p>
              )}
            </div>
          </div>
          <div className="panel p-5">
            <h2 className="text-xl font-bold">Needs More Evidence</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {dashboard.needsMoreEvidence.length ? (
                dashboard.needsMoreEvidence.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-800"
                  >
                    {area}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-600">Confidence is stable for current scores.</p>
              )}
            </div>
          </div>
          <div className="panel p-5">
            <h2 className="text-xl font-bold">Review Due</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {dashboard.reviewDue.length ? (
                dashboard.reviewDue.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-800"
                  >
                    {area}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-600">No spaced reviews are due yet.</p>
              )}
            </div>
          </div>
          <div className="panel p-5">
            <h2 className="text-xl font-bold">Strong Areas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {dashboard.strongAreas.length ? (
                dashboard.strongAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800"
                  >
                    {area}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-600">Strengths appear after assessment.</p>
              )}
            </div>
          </div>
          <div className="panel p-5">
            <h2 className="text-xl font-bold">Learning Evidence</h2>
            {dashboard.masteryEvidence.length ? (
              <div className="mt-3 space-y-3">
                {dashboard.masteryEvidence.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.conceptId}: {Math.round(item.previousMastery * 100)}% to{" "}
                      {Math.round(item.newMastery * 100)}%
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.reason}</p>
                    {item.misconception ? (
                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        Misconception: {item.misconception}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Evidence appears after assessment or quizzes.</p>
            )}
          </div>
          <div className="panel p-5">
            <h2 className="text-xl font-bold">Privacy</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
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
