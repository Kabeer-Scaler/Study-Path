import type { LessonStatus } from "@/lib/types";

const statusStyles: Record<LessonStatus, string> = {
  not_started: "border-slate-200 bg-slate-50 text-slate-600",
  in_progress: "border-indigo-200 bg-indigo-50 text-indigo-700",
  completed: "border-teal-200 bg-teal-50 text-teal-800",
  needs_review: "border-amber-200 bg-amber-50 text-amber-800",
  skipped: "border-slate-200 bg-white text-slate-500",
  mastered: "border-emerald-200 bg-emerald-50 text-emerald-800"
};

const labels: Record<LessonStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  needs_review: "Needs review",
  skipped: "Skipped",
  mastered: "Mastered"
};

export function StatusBadge({ status }: { status: LessonStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
