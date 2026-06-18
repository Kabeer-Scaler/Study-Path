import { ReactNode } from "react";

/** Slow gradient sweep across text — for "AI" labels and tutor name. */
export function ShimmerText({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`shimmer-text ${className}`}>{children}</span>;
}

export default ShimmerText;
