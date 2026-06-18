import { CheckCircle2, Circle, RotateCcw, SkipForward } from "lucide-react";
import type { Lesson, Module } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

type ModuleWithLessons = Module & { lessons: Lesson[]; completedCount?: number };

export function CurriculumMap({ modules }: { modules: ModuleWithLessons[] }) {
  return (
    <ol className="space-y-4">
      {modules.map((module, index) => {
        const completed = module.lessons.filter((lesson) =>
          ["completed", "mastered", "skipped"].includes(lesson.status)
        ).length;
        return (
          <li key={module.id} className="relative pl-10">
            {index < modules.length - 1 ? (
              <span className="absolute left-4 top-8 h-full w-px bg-slate-200" />
            ) : null}
            <span className="absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full border border-teal-200 bg-white text-teal-700">
              {completed === module.lessons.length ? (
                <CheckCircle2 size={18} aria-hidden />
              ) : completed > 0 ? (
                <RotateCcw size={17} aria-hidden />
              ) : (
                <Circle size={16} aria-hidden />
              )}
            </span>
            <div className="subtle-panel p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                    Module {index + 1}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-950">
                    {module.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{module.reason}</p>
                </div>
                <span className="text-sm font-semibold text-slate-500">
                  {completed}/{module.lessons.length} done
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{lesson.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {lesson.estimatedMinutes} min · target {Math.round(lesson.masteryTarget * 100)}%
                        {lesson.isRemedial ? " · remedial" : ""}
                        {lesson.isChallenge ? " · challenge" : ""}
                      </p>
                      {lesson.whySkipped || lesson.isRemedial ? (
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {lesson.whySkipped ?? lesson.whyAssigned}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.status === "skipped" ? (
                        <SkipForward size={16} className="text-slate-400" aria-hidden />
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
