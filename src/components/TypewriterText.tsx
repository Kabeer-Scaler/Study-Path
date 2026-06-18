"use client";

import { useEffect, useState } from "react";

/**
 * Simple typewriter that reveals `text` character-by-character on mount.
 * Falls back to full text instantly for screen readers via aria-label.
 */
export function TypewriterText({
  text,
  speedMs = 28,
  startDelayMs = 0,
  className = "",
  cursor = true
}: {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  className?: string;
  cursor?: boolean;
}) {
  const [shown, setShown] = useState(0);
  const [started, setStarted] = useState(startDelayMs === 0);

  useEffect(() => {
    if (started) return;
    const t = setTimeout(() => setStarted(true), startDelayMs);
    return () => clearTimeout(t);
  }, [startDelayMs, started]);

  useEffect(() => {
    if (!started) return;
    if (shown >= text.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), speedMs);
    return () => clearTimeout(t);
  }, [shown, text, speedMs, started]);

  const done = shown >= text.length;

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{text.slice(0, shown)}</span>
      {cursor ? (
        <span
          aria-hidden
          className={`ml-0.5 inline-block w-[2px] -mb-0.5 h-[1em] align-middle bg-accent ${
            done ? "animate-blink" : ""
          }`}
        />
      ) : null}
    </span>
  );
}

export default TypewriterText;
