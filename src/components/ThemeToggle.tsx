"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`group relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-accent hover:shadow-glow ${className}`}
    >
      <Sun
        size={18}
        aria-hidden
        className={`absolute transition-all duration-300 ${
          isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        }`}
      />
      <Moon
        size={18}
        aria-hidden
        className={`absolute transition-all duration-300 ${
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"
        }`}
      />
    </button>
  );
}
