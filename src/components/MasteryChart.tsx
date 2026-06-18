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
        const gradient =
          percent >= 80
            ? "from-icy-aqua to-light-blue"
            : percent >= 60
              ? "from-light-blue to-powder-blush"
              : "from-powder-blush to-powder-blush/70";
        return (
          <div
            key={concept.id}
            className="space-y-1.5 animate-stagger-fade"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-ink">{concept.name}</span>
              <span className="tabular-nums text-muted">
                <CountUp value={percent} />%
              </span>
            </div>
            <div
              className="relative h-3 overflow-hidden rounded-full bg-surface-muted"
              aria-label={`${concept.name} mastery ${percent}%`}
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out`}
                style={{ width: mounted ? `${percent}%` : "0%" }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{
                  animation: "progress-sweep 2.4s ease-in-out infinite",
                  animationDelay: `${i * 80}ms`,
                  mixBlendMode: "overlay"
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
