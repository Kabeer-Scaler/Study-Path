"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value from 0 → `value` once on mount and whenever `value` changes.
 * Renders via `format(current)` if provided, else as a localized integer.
 */
export function CountUp({
  value,
  durationMs = 900,
  format,
  className = ""
}: {
  value: number;
  durationMs?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    const target = value;
    function tick(ts: number) {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + (target - fromRef.current) * eased;
      setDisplay(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  const rendered = format
    ? format(display)
    : Math.round(display).toLocaleString();
  return (
    <span className={`tabular-nums ${className}`}>{rendered}</span>
  );
}

export default CountUp;
