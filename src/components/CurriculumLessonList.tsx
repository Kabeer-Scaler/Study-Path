"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { Dropdown } from "@/components/Dropdown";
import type { Lesson, Module } from "@/lib/types";

type ModuleWithLessons = Module & { lessons: Lesson[] };

const VIEW_OPTIONS = [
  { value: "all", label: "All lessons", description: "Show everything" },
  { value: "open", label: "Open only", description: "Hide completed / mastered" },
  { value: "remedial", label: "Remedial focus", description: "Review-heavy first" }
];

export function CurriculumLessonList({ modules }: { modules: ModuleWithLessons[] }) {
  const [view, setView] = useState("all");

  const filtered = useMemo(() => {
    return modules.map((module) => {
      let lessons = module.lessons;
      if (view === "open") {
        lessons = lessons.filter(
          (l) => !["completed", "mastered", "skipped"].includes(l.status)
        );
      } else if (view === "remedial") {
        lessons = [...lessons].sort((a, b) => {
          const score = (l: Lesson) => (l.isRemedial ? 0 : 1);
          return score(a) - score(b);
        });
      }
      return { ...module, lessons };
    });
  }, [modules, view]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="panel relative z-30 shrink-0 p-4">
        <Dropdown
          label="View"
          options={VIEW_OPTIONS}
          value={view}
          onChange={setView}
        />
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain">
      {filtered.map((module) => (
        <section key={module.id} className="panel p-4 sm:p-5">
          <h2 className="font-bold text-ink">{module.title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">{module.reason}</p>
          <div className="mt-3 space-y-3">
            {module.lessons.length === 0 ? (
              <p className="text-sm text-muted">Nothing matches this view.</p>
            ) : (
              module.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="border-t border-line/70 pt-3 first:border-0 first:pt-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      className="font-semibold leading-snug text-ink underline-offset-4 transition hover:text-accent hover:underline"
                      href={`/lesson/${lesson.id}`}
                    >
                      {lesson.title}
                    </Link>
                    <StatusBadge status={lesson.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                    {lesson.whyAssigned}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      ))}
      </div>
    </div>
  );
}
