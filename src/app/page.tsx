import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  MessageSquareText,
  Route,
  Sparkles,
  GraduationCap,
  LineChart,
  Compass
} from "lucide-react";
import { AuroraBackground } from "@/components/AuroraBackground";
import { NeuralOrbs } from "@/components/NeuralOrbs";
import { TypewriterText } from "@/components/TypewriterText";

const featureCards = [
  {
    title: "Adaptive assessment",
    body: "Starts mid-difficulty, follows wrong answers with targeted prerequisites, and stops after a compact diagnosis.",
    icon: BrainCircuit,
    tone: "from-powder-blush/40 to-powder-blush/0"
  },
  {
    title: "Personalised curriculum",
    body: "Skips mastered concepts, adds review when mastery is low, and explains why every lesson appears.",
    icon: Route,
    tone: "from-icy-aqua/40 to-icy-aqua/0"
  },
  {
    title: "Interactive lessons",
    body: "Each lesson includes an objective, analogy, examples, inline practice, common mistakes, and an end quiz.",
    icon: GraduationCap,
    tone: "from-light-blue/45 to-light-blue/0"
  },
  {
    title: "Progress engine",
    body: "Quiz scores update mastery, add remedial work when needed, and refresh dashboard recommendations.",
    icon: LineChart,
    tone: "from-vanilla-cream/70 to-vanilla-cream/0"
  }
];

const stepCards: Array<{
  title: string;
  subtitle: string;
  position: string;
  icon: typeof BrainCircuit;
  badge: string;
}> = [
  {
    title: "Assess",
    subtitle: "Knowledge gaps",
    position: "left-0 top-16",
    icon: BrainCircuit,
    badge: "bg-powder-blush"
  },
  {
    title: "Path",
    subtitle: "Prerequisite order",
    position: "right-0 top-32",
    icon: Route,
    badge: "bg-light-blue"
  },
  {
    title: "Tutor",
    subtitle: "Socratic hints",
    position: "left-8 bottom-24",
    icon: MessageSquareText,
    badge: "bg-icy-aqua"
  },
  {
    title: "Adapt",
    subtitle: "Quiz-driven review",
    position: "right-10 bottom-0",
    icon: CheckCircle2,
    badge: "bg-vanilla-cream"
  }
];

export default function HomePage() {
  return (
    <main className="animate-fade-in">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient -z-20" />
        <AuroraBackground intensity="medium" />
        <NeuralOrbs count={6} />
        <div className="page-shell relative grid min-h-[560px] content-center gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center">
          <div className="animate-fade-in">
            <span className="chip-accent">
              <Sparkles size={14} aria-hidden className="animate-pulse" />
              <span className="shimmer-text">Adaptive · Socratic · Personal</span>
            </span>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              <span className="text-gradient-animated">Learn anything,</span>
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
                <Compass size={18} aria-hidden />
                I have an account
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-powder-blush" />
                Diagnose
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-light-blue" />
                Plan
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-icy-aqua" />
                Teach
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-slate" />
                Adapt
              </span>
            </div>
          </div>

          <div className="relative min-h-[420px]" aria-label="Learning path preview">
            <div className="absolute left-8 top-2 h-24 w-24 animate-float rounded-full border border-powder-blush/40 bg-powder-blush/30" />
            <div
              className="absolute right-10 top-0 h-20 w-20 animate-float rounded-full border border-icy-aqua/60 bg-icy-aqua/40"
              style={{ animationDelay: "1.2s" }}
            />
            <div
              className="absolute bottom-12 left-20 h-16 w-16 animate-float rounded-full border border-light-blue/60 bg-light-blue/40"
              style={{ animationDelay: "2.4s" }}
            />
            <div className="absolute left-14 right-16 top-28 h-1 rotate-6 rounded-full bg-line" />
            <div className="absolute bottom-36 left-28 right-14 h-1 -rotate-12 rounded-full bg-line" />
            {stepCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`group absolute ${card.position} w-56 rounded-2xl border border-line bg-surface/95 p-4 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-glow animate-fade-in`}
                  style={{ animationDelay: `${idx * 120}ms` }}
                >
                  <div
                    className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${card.badge} text-blue-slate shadow-soft transition group-hover:scale-110`}
                  >
                    <Icon size={19} aria-hidden />
                  </div>
                  <p className="font-bold text-ink">{card.title}</p>
                  <p className="mt-1 text-sm text-muted">{card.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="page-shell grid gap-5 py-10 md:grid-cols-2 lg:grid-cols-4">
        {featureCards.map(({ title, body, icon: Icon, tone }, idx) => (
          <div
            key={title}
            className="panel panel-hover relative overflow-hidden p-5 animate-fade-in"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div
              className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${tone}`}
            />
            <div className="relative">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-powder-blush/40 to-icy-aqua/40 text-ink shadow-soft">
                <Icon size={20} aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA STRIP */}
      <section className="page-shell pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-icy-aqua/30 via-surface to-powder-blush/30 p-8 shadow-soft sm:p-12">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-powder-blush/30 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-light-blue/30 blur-2xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-2xl font-extrabold text-ink sm:text-3xl">
                Ready to map your own learning path?
              </h3>
              <p className="mt-2 max-w-xl text-muted">
                Create an account, share what you'd like to master, and let the
                adaptive engine do the planning.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="accent-button" href="/register">
                Get started
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link className="secondary-button" href="/login">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
