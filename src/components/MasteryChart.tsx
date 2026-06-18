export function MasteryChart({
  mastery,
  conceptNames,
  conceptOrder,
  compact = false
}: {
  mastery: Record<string, number>;
  conceptNames?: Record<string, string>;
  conceptOrder?: string[];
  compact?: boolean;
}) {
  const ids = conceptOrder?.length ? conceptOrder : Object.keys(mastery);
  const rows = ids.map((conceptId) => ({
    id: conceptId,
    name: conceptNames?.[conceptId] ?? conceptId,
    score: mastery[conceptId] ?? 0
  }));

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {rows.map((concept) => {
        const percent = Math.round(concept.score * 100);
        const color =
          percent >= 80
            ? "bg-teal-600"
            : percent >= 60
              ? "bg-indigo-600"
              : "bg-[var(--coral)]";
        return (
          <div key={concept.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-slate-800">{concept.name}</span>
              <span className="tabular-nums text-slate-600">{percent}%</span>
            </div>
            <div
              className="h-3 rounded-full bg-slate-100"
              aria-label={`${concept.name} mastery ${percent}%`}
            >
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
