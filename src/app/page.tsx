import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2, MessageSquareText, Route } from "lucide-react";

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-teal-50 to-transparent" />
        <div className="page-shell relative grid min-h-[520px] content-center gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
          <div>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight text-slate-950 sm:text-6xl">
              LearnPath AI
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              An adaptive learning platform that diagnoses any learner-selected topic,
              generates a personalised curriculum, teaches through interactive lessons,
              and updates mastery after quizzes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="primary-button" href="/register">
                Register
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link className="secondary-button" href="/login">
                Login
              </Link>
            </div>
          </div>

          <div className="relative min-h-[360px]" aria-label="Learning path preview">
            <div className="absolute left-6 top-6 h-20 w-20 rounded-full border border-teal-200 bg-teal-50" />
            <div className="absolute right-8 top-2 h-16 w-16 rounded-full border border-amber-200 bg-amber-50" />
            <div className="absolute bottom-8 left-16 h-14 w-14 rounded-full border border-indigo-200 bg-indigo-50" />
            <div className="absolute left-14 right-16 top-24 h-1 rotate-6 rounded-full bg-slate-200" />
            <div className="absolute bottom-32 left-28 right-14 h-1 -rotate-12 rounded-full bg-slate-200" />
            {[
              ["Assess", "Knowledge gaps", "left-0 top-20", "bg-teal-700"],
              ["Path", "Prerequisite order", "right-0 top-32", "bg-indigo-700"],
              ["Tutor", "Socratic hints", "left-10 bottom-24", "bg-amber-600"],
              ["Adapt", "Quiz-driven review", "right-10 bottom-0", "bg-rose-600"]
            ].map(([title, subtitle, position, color]) => (
              <div
                key={title}
                className={`absolute ${position} w-56 rounded-lg border border-slate-200 bg-white p-4 shadow-soft`}
              >
                <div className={`mb-3 grid h-10 w-10 place-items-center rounded-md ${color} text-white`}>
                  {title === "Assess" ? (
                    <BrainCircuit size={19} aria-hidden />
                  ) : title === "Path" ? (
                    <Route size={19} aria-hidden />
                  ) : title === "Tutor" ? (
                    <MessageSquareText size={19} aria-hidden />
                  ) : (
                    <CheckCircle2 size={19} aria-hidden />
                  )}
                </div>
                <p className="font-bold text-slate-950">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-5 py-8 md:grid-cols-4">
        {[
          ["Adaptive assessment", "Starts medium, follows wrong answers with targeted prerequisites, and stops after a compact diagnosis."],
          ["Personalised curriculum", "Skips mastered concepts, adds review when mastery is low, and explains why every lesson appears."],
          ["Interactive lessons", "Each lesson includes objective, analogy, examples, inline practice, common mistakes, and an end quiz."],
          ["Progress engine", "Quiz scores update mastery, add remedial work when needed, and refresh dashboard recommendations."]
        ].map(([title, copy]) => (
          <div key={title} className="panel p-5">
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
