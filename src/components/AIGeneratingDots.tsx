/**
 * Animated dot trio used in place of "Loading…" for AI generation states.
 * Composes with an optional label like "synthesizing your path".
 */
export function AIGeneratingDots({
  label,
  className = ""
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      {label ? <span>{label}</span> : null}
      <span className="inline-flex items-end gap-1" aria-hidden>
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-dot-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-dot-bounce"
          style={{ animationDelay: "160ms" }}
        />
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-dot-bounce"
          style={{ animationDelay: "320ms" }}
        />
      </span>
    </span>
  );
}

export default AIGeneratingDots;
