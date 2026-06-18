"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Re-keys its children by pathname so the `animate-fade-up` animation
 * replays on every client-side route change.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-up">
      {children}
    </div>
  );
}

export default PageTransition;
