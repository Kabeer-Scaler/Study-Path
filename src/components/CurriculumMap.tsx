import { CheckCircle2, Circle, RotateCcw, SkipForward } from "lucide-react";
import type { Lesson, Module } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

type ModuleWithLessons = Module & { lessons: Lesson[]; completedCount?: number };

export function CurriculumMap({ modules }: { modules: ModuleWithLessons[] }) {
  // Find first not-yet-completed lesson — that's the "active" node.
  const DONE = new Set(["completed", "mastered", "skipped"]);
  let activeLessonId: string | null = null;
  for (const m of modules) {
    for (const l of m.lessons) {
      if (!DONE.has(l.status)) {
        activeLessonId = l.id;
        break;
      }
    }
    if (activeLessonId) break;
  }
  return (
    <ol className="space-y-5">
      {modules.map((module, index) => {
        const completed = module.lessons.filter((lesson) =>
          ["completed", "mastered", "skipped"].includes(lesson.status)
        ).length;
        const ratio = module.lessons.length
          ? completed / module.lessons.length
          : 0;
        const Icon =
          completed === module.lessons.length
            ? CheckCircle2
            : completed > 0
              ? RotateCcw
              : Circle;
        return (
          <li
            key={module.id}
            className="relative pl-12 animate-stagger-fade"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            {index < modules.length - 1 ? (
              <span className="absolute left-[19px] top-10 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-line to-transparent" />
            ) : null}
            <span
              className={`absolute left-0 top-1 grid h-10 w-10 place-items-center rounded-full border shadow-soft transition ${
                ratio === 1
                  ? "border-icy-aqua/60 bg-icy-aqua/30 text-ink"
                  : ratio > 0
                    ? "border-light-blue/60 bg-light-blue/25 text-ink"
                    : "border-line bg-surface text-muted"
              }`}
            >
              <Icon size={18} aria-hidden />
            </span>
            <div className="subtle-panel p-4 transition hover:border-accent/50 hover:shadow-soft">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">
                    Module {index + 1}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-ink">
                    {module.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{module.reason}</p>
                </div>
                <span className="chip-highlight whitespace-nowrap">
                  {completed}/{module.lessons.length} done
                </span>
              </div>
              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-powder-blush via-icy-aqua to-light-blue transition-all duration-1000 ease-out"
                  style={{ width: `${ratio * 100}%`, backgroundSize: "200% 100%" }}
                />
              </div>
              <div className="mt-4 grid gap-2">
                {module.lessons.map((lesson, lIdx) => (
                  <div
                    key={lesson.id}
                    className={`flex flex-col gap-2 rounded-xl border bg-surface p-3 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-soft sm:flex-row sm:items-center sm:justify-between animate-stagger-fade ${
                      lesson.id === activeLessonId
                        ? "border-accent/70 ai-glow animate-pulse-glow"
                        : "border-line"
                    }`}
                    style={{ animationDelay: `${index * 70 + lIdx * 40}ms` }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{lesson.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {lesson.estimatedMinutes} min · target {Math.round(lesson.masteryTarget * 100)}%
                        {lesson.isRemedial ? " · remedial" : ""}
                        {lesson.isChallenge ? " · challenge" : ""}
                      </p>
                      {lesson.whySkipped || lesson.isRemedial ? (
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {lesson.whySkipped ?? lesson.whyAssigned}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.status === "skipped" ? (
                        <SkipForward size={16} className="text-muted" aria-hidden />
                      ) : null}
                      <StatusBadge status={lesson.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
