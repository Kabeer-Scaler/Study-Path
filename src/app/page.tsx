import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Route,
  GraduationCap,
  LineChart
} from "lucide-react";
import { findAuthenticatedUser, SESSION_COOKIE } from "@/lib/auth";
import { readStore } from "@/lib/db/store";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TypewriterText } from "@/components/TypewriterText";

export const dynamic = "force-dynamic";

const featureCards = [
  {
    title: "Adaptive assessment",
    body: "Starts mid-difficulty, follows wrong answers with targeted prerequisites, and stops after a compact diagnosis.",
    icon: BrainCircuit
  },
  {
    title: "Personalised curriculum",
    body: "Skips mastered concepts, adds review when mastery is low, and explains why every lesson appears.",
    icon: Route
  },
  {
    title: "Interactive lessons",
    body: "Each lesson includes an objective, analogy, examples, inline practice, common mistakes, and an end quiz.",
    icon: GraduationCap
  },
  {
    title: "Progress engine",
    body: "Quiz scores update mastery, add remedial work when needed, and refresh dashboard recommendations.",
    icon: LineChart
  }
];

export default async function HomePage() {
  const store = await readStore();
  const authUser = findAuthenticatedUser(
    store,
    (await cookies()).get(SESSION_COOKIE)?.value ?? ""
  );
  if (authUser) redirect(`/dashboard/${authUser.id}`);

  return (
    <main className="animate-fade-in flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* HERO */}
      <section className="relative">
        <div className="page-shell relative grid min-h-[560px] content-center gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center">
          <div className="animate-fade-in">
            <span className="chip-accent uppercase tracking-[0.16em]">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Adaptive · Socratic · Personal
            </span>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">
              <span className="italic text-accent">Learn anything,</span>
              <br />
              <span className="text-ink">on your path.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              <TypewriterText
                text="LearnPath AI diagnoses any topic, generates a personalised curriculum, and teaches through adaptive lessons — so every minute counts."
                speedMs={22}
              />
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="accent-button" href="/register">
                Start free
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link className="secondary-button" href="/login">
                I have an account
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Diagnose
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-highlight" />
                Plan
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent-strong" />
                Teach
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warn" />
                Adapt
              </span>
            </div>
          </div>

          {/* Forest path card */}
          <div className="relative animate-fade-in" aria-label="Learning path preview">
            <div className="rounded-3xl bg-blue-slate p-8 text-vanilla-cream shadow-soft">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-highlight" />
                <span className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-highlight">
                  Your adaptive path
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-medium">Python Fundamentals</h3>
              <p className="mt-1 text-sm text-vanilla-cream/60">
                7 concepts · ordered by prerequisites
              </p>
              <div className="mt-6 flex flex-col">
                <div className="flex items-center justify-between gap-3 border-b border-vanilla-cream/10 py-3">
                  <span className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-highlight" />
                    <span className="text-sm">Variables &amp; types</span>
                  </span>
                  <span className="text-xs font-semibold text-highlight">Mastered</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-vanilla-cream/10 py-3">
                  <span className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-accent" />
                    <span className="text-sm">Functions</span>
                  </span>
                  <span className="text-xs font-semibold text-vanilla-cream/85">
                    In progress
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-vanilla-cream/30" />
                    <span className="text-sm text-vanilla-cream/65">Comprehensions</span>
                  </span>
                  <span className="text-xs font-semibold text-vanilla-cream/40">Up next</span>
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs text-vanilla-cream/60">
                  <span>Overall progress</span>
                  <span className="font-semibold text-highlight">42%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-vanilla-cream/15">
                  <div
                    className="h-full rounded-full bg-highlight"
                    style={{ width: "42%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="page-shell grid gap-5 py-10 md:grid-cols-2 lg:grid-cols-4">
        {featureCards.map(({ title, body, icon: Icon }, idx) => (
          <div
            key={title}
            className="panel panel-hover relative p-5 animate-fade-in"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-highlight/25 text-accent shadow-soft">
              <Icon size={20} aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </div>
        ))}
      </section>

      {/* CTA STRIP */}
      <section className="page-shell pb-16">
        <div className="rounded-3xl bg-blue-slate p-8 text-vanilla-cream shadow-soft sm:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-2xl font-medium sm:text-3xl">
                Ready to map your own learning path?
              </h3>
              <p className="mt-2 max-w-xl text-vanilla-cream/70">
                Create an account, share what you'd like to master, and let the
                adaptive engine do the planning.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-highlight px-5 py-2.5 text-sm font-semibold text-blue-slate transition hover:-translate-y-0.5"
                href="/register"
              >
                Get started
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-vanilla-cream/30 px-5 py-2.5 text-sm font-semibold text-vanilla-cream transition hover:border-vanilla-cream"
                href="/login"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
