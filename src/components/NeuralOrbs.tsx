/**
 * Small floating glowing orbs that drift behind hero sections.
 * Uses `mix-blend-mode: screen` (light) / `plus-lighter` (dark) via CSS var.
 */
const PALETTE = [
  "var(--c-accent)",
  "var(--c-highlight)",
  "var(--c-secondary)",
  "var(--aurora-4)"
];

export function NeuralOrbs({
  count = 5,
  className = ""
}: {
  count?: number;
  className?: string;
}) {
  // Deterministic positions / sizes so SSR matches client.
  const orbs = Array.from({ length: count }, (_, i) => {
    const ratio = i / Math.max(count - 1, 1);
    return {
      top: `${10 + ((i * 47) % 80)}%`,
      left: `${(i * 53 + 8) % 92}%`,
      size: 90 + ((i * 37) % 140),
      color: PALETTE[i % PALETTE.length],
      delay: -(i * 2.7).toFixed(2),
      duration: 12 + ((i * 5) % 10),
      ratio
    };
  });

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden -z-10 ${className}`}
    >
      {orbs.map((o, i) => (
        <span
          key={i}
          className="orb absolute animate-float-drift rounded-full"
          style={{
            top: o.top,
            left: o.left,
            width: o.size,
            height: o.size,
            background: `radial-gradient(circle at 35% 35%, rgba(${o.color}, 0.85), rgba(${o.color}, 0.0) 70%)`,
            animationDelay: `${o.delay}s`,
            animationDuration: `${o.duration}s`,
            opacity: 0.75 - o.ratio * 0.25
          }}
        />
      ))}
    </div>
  );
}

export default NeuralOrbs;
