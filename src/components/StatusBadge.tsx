import type { LessonStatus } from "@/lib/types";

const statusStyles: Record<LessonStatus, string> = {
  not_started: "border-line bg-surface-muted text-muted",
  in_progress: "border-light-blue/60 bg-light-blue/25 text-ink",
  completed: "border-icy-aqua/60 bg-icy-aqua/30 text-ink",
  needs_review: "border-powder-blush/60 bg-powder-blush/25 text-ink",
  skipped: "border-line bg-surface text-muted",
  mastered: "border-icy-aqua/70 bg-icy-aqua/45 text-ink"
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
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition ${statusStyles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
