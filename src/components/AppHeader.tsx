"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, Map, MessageSquareText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type AuthUser = {
  id: string;
};

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setChecked(false);
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (cancelled) return;
        if (!response.ok) {
          setUser(null);
          return;
        }
        const payload = await response.json();
        setUser(payload.user ? { id: payload.user.id } : null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setLoggingOut(false);
    router.refresh();
    router.push("/login");
  }

  const homeHref = checked && user ? `/dashboard/${user.id}` : "/";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href={homeHref}
        className="group flex items-center gap-3 transition hover:opacity-90"
      >
        <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-blue-slate text-vanilla-cream shadow-soft transition group-hover:scale-105">
          <span className="font-display text-2xl font-medium italic leading-none">L</span>
          <span className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-icy-aqua" />
        </span>
        <span>
          <span className="font-display block text-lg font-semibold tracking-tight text-ink">
            LearnPath<span className="italic font-normal text-accent"> AI</span>
          </span>
          <span className="block text-[0.625rem] font-bold uppercase tracking-[0.24em] text-muted">
            Learn on your own path
          </span>
        </span>
      </Link>

      <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        {checked && user ? (
          <button
            className="secondary-button min-h-9 px-3"
            disabled={loggingOut}
            onClick={logout}
            type="button"
          >
            <LogOut size={16} aria-hidden />
            {loggingOut ? "Signing out…" : "Logout"}
          </button>
        ) : checked ? (
          <>
            <Link className="secondary-button min-h-9 px-3" href="/register">
              <Map size={16} aria-hidden />
              Register
            </Link>
            <Link className="secondary-button min-h-9 px-3" href="/login">
              <LogIn size={16} aria-hidden />
              Login
            </Link>
          </>
        ) : null}
        <span className="chip-highlight">
          <MessageSquareText size={14} aria-hidden />
          Socratic Tutor
        </span>
        <ThemeToggle className="ml-1" />
      </nav>
    </div>
  );
}
