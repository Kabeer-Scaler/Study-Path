"use client";

import { useEffect, useState } from "react";
import { CountUp } from "@/components/CountUp";

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

  // Animate bars from 0 → target on mount and whenever the mastery values change.
  const signature = rows.map((r) => `${r.id}:${r.score}`).join("|");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(false);
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [signature]);

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {rows.map((concept, i) => {
        const percent = Math.round(concept.score * 100);
        const barColor =
          percent >= 80
            ? "bg-highlight"
            : percent >= 60
              ? "bg-accent"
              : "bg-warn";
        return (
          <div
            key={concept.id}
            className="flex flex-col gap-1.5 animate-stagger-fade"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-semibold text-ink">{concept.name}</span>
              <span className="shrink-0 tabular-nums text-muted">
                <CountUp value={percent} />%
              </span>
            </div>
            <div
              className={`relative overflow-hidden rounded-full bg-surface-muted ${compact ? "h-2" : "h-3"}`}
              aria-label={`${concept.name} mastery ${percent}%`}
            >
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
                style={{ width: mounted ? `${percent}%` : "0%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
