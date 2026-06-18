import type { Metadata } from "next";
import Link from "next/link";
import { BrainCircuit, LogIn, Map, MessageSquareText } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnPath AI",
  description: "Personalised learning path generator for any learner-selected topic"
};

// Inline script avoids FOUC by applying the theme before paint.
const themeBootstrap = `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (_) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ThemeProvider>
          <header className="sticky top-0 z-30 border-b border-line/70 glass">
            <div className="page-shell flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/"
                className="group flex items-center gap-3 transition hover:opacity-90"
              >
                <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-powder-blush via-icy-aqua to-light-blue text-blue-slate shadow-glow transition group-hover:scale-105 animate-pulse-glow">
                  <BrainCircuit size={22} aria-hidden />
                </span>
                <span>
                  <span className="block text-lg font-extrabold tracking-tight text-gradient-animated">
                    LearnPath AI
                  </span>
                  <span className="block text-xs font-medium text-muted">
                    Adaptive AI tutoring platform
                  </span>
                </span>
              </Link>
              <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                <Link className="secondary-button min-h-9 px-3" href="/register">
                  <Map size={16} aria-hidden />
                  Register
                </Link>
                <Link className="secondary-button min-h-9 px-3" href="/login">
                  <LogIn size={16} aria-hidden />
                  Login
                </Link>
                <span className="chip-highlight">
                  <MessageSquareText size={14} aria-hidden />
                  Socratic Tutor
                </span>
                <ThemeToggle className="ml-1" />
              </nav>
            </div>
          </header>
          <PageTransition>{children}</PageTransition>
          <footer className="mt-16 border-t border-line/70 bg-surface/40">
            <div className="page-shell flex flex-col items-start justify-between gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center">
              <span>
                Crafted with adaptive learning in mind ·{" "}
                <span className="text-ink">LearnPath AI</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-icy-aqua" />
                <span className="inline-block h-2 w-2 rounded-full bg-powder-blush" />
                <span className="inline-block h-2 w-2 rounded-full bg-light-blue" />
                Calm palette · soft motion
              </span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
