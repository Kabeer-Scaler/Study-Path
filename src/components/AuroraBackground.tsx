/**
 * Slowly-drifting conic/radial gradient background.
 * Pure CSS — no JS. Sits behind hero/auth sections with `pointer-events-none`.
 */
export function AuroraBackground({
  className = "",
  intensity = "medium"
}: {
  className?: string;
  intensity?: "soft" | "medium" | "bold";
}) {
  const opacity =
    intensity === "soft" ? 0.45 : intensity === "bold" ? 0.95 : 0.7;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden -z-10 ${className}`}
    >
      <div
        className="absolute -inset-[20%] animate-aurora"
        style={{
          opacity,
          background: `
            radial-gradient(at 18% 22%, rgba(var(--aurora-1), 0.55), transparent 45%),
            radial-gradient(at 78% 18%, rgba(var(--aurora-2), 0.55), transparent 48%),
            radial-gradient(at 30% 82%, rgba(var(--aurora-3), 0.50), transparent 50%),
            radial-gradient(at 80% 78%, rgba(var(--aurora-4), 0.45), transparent 50%)
          `,
          filter: "blur(40px)"
        }}
      />
      <div
        className="absolute -inset-[10%] animate-aurora"
        style={{
          opacity: opacity * 0.55,
          animationDelay: "-7s",
          background: `
            conic-gradient(from 120deg at 60% 40%,
              rgba(var(--aurora-1), 0.20),
              rgba(var(--aurora-2), 0.20),
              rgba(var(--aurora-3), 0.20),
              rgba(var(--aurora-4), 0.20),
              rgba(var(--aurora-1), 0.20))
          `,
          filter: "blur(60px)"
        }}
      />
    </div>
  );
}

export default AuroraBackground;
