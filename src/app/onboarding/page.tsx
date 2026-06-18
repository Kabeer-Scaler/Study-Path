"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, UserRound, BookOpen, Gauge, Clock, GraduationCap } from "lucide-react";
import { DEFAULT_SUBJECT } from "@/lib/db/seed";
import { Dropdown } from "@/components/Dropdown";
import { AIGeneratingDots } from "@/components/AIGeneratingDots";

const SUBJECT_OPTIONS = [
  { value: "Python Programming Fundamentals", label: "Python Programming Fundamentals", description: "Syntax, data structures, idioms" },
  { value: "JavaScript & Web Basics", label: "JavaScript & Web Basics", description: "JS, DOM, modern web" },
  { value: "TypeScript Essentials", label: "TypeScript Essentials", description: "Types, generics, tooling" },
  { value: "Data Structures & Algorithms", label: "Data Structures & Algorithms", description: "Big-O, classic patterns" },
  { value: "SQL & Databases", label: "SQL & Databases", description: "Queries, joins, modeling" },
  { value: "Machine Learning Foundations", label: "Machine Learning Foundations", description: "Core ML concepts & math" },
  { value: "Deep Learning with PyTorch", label: "Deep Learning with PyTorch", description: "Neural nets, training loops" },
  { value: "Linear Algebra", label: "Linear Algebra", description: "Vectors, matrices, spaces" },
  { value: "Calculus Refresher", label: "Calculus Refresher", description: "Derivatives, integrals" },
  { value: "Statistics & Probability", label: "Statistics & Probability", description: "Distributions, inference" },
  { value: "System Design Basics", label: "System Design Basics", description: "Scaling, trade-offs" },
  { value: "React & Frontend Engineering", label: "React & Frontend Engineering", description: "Components, hooks, state" },
  { value: "__custom__", label: "Other / custom subject…", description: "Type your own subject" }
];

const initialForm = {
  subject: DEFAULT_SUBJECT,
  goal: "Build a clear foundation and practice with examples",
  selfRatedLevel: "Beginner",
  preferredStyle: "Examples and practice",
  dailyTimeMinutes: 30
};

const LEVEL_OPTIONS = [
  { value: "Absolute beginner", label: "Absolute beginner", description: "Brand new to the topic" },
  { value: "Beginner", label: "Beginner", description: "Some exposure, building basics" },
  { value: "Intermediate", label: "Intermediate", description: "Comfortable with fundamentals" },
  { value: "Advanced", label: "Advanced", description: "Looking to deepen mastery" }
];

const STYLE_OPTIONS = [
  { value: "Examples and practice", label: "Examples and practice", description: "Learn by doing" },
  { value: "Code examples", label: "Code examples", description: "Read-and-run snippets" },
  { value: "Practice first", label: "Practice first", description: "Try, then learn the theory" },
  { value: "Theory first", label: "Theory first", description: "Concepts before practice" },
  { value: "Visual analogies", label: "Visual analogies", description: "Pictures and metaphors" }
];

const TIME_OPTIONS = [
  { value: "15", label: "15 minutes / day", description: "Quick daily touch" },
  { value: "30", label: "30 minutes / day", description: "Balanced pace" },
  { value: "45", label: "45 minutes / day", description: "Focused study" },
  { value: "60", label: "60 minutes / day", description: "Deep work" },
  { value: "90", label: "90 minutes / day", description: "Power session" }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [learnerName, setLearnerName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const presetSubjects = SUBJECT_OPTIONS.map((option) => option.value);
  const isCustomSubject = !presetSubjects.includes(form.subject);
  const subjectDropdownValue = isCustomSubject ? "__custom__" : form.subject;

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) {
          router.push("/login");
          return;
        }
        const payload = await response.json();
        setLearnerName(payload.user?.name ?? "");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  function update(field: keyof typeof initialForm, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!form.goal.trim()) {
      setError("Learning goal is required.");
      return;
    }
    setLoading(true);
    const userResponse = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const userPayload = await userResponse.json();
    if (!userResponse.ok) {
      setLoading(false);
      setError(userPayload.error ?? "Could not create learner profile.");
      return;
    }

    const assessmentResponse = await fetch("/api/assessment/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userPayload.userId, subject: form.subject })
    });
    const assessmentPayload = await assessmentResponse.json();
    setLoading(false);
    if (!assessmentResponse.ok) {
      setError(assessmentPayload.error ?? "Could not start assessment.");
      return;
    }
    router.push(`/assessment/${assessmentPayload.sessionId}`);
  }

  return (
    <main className="page-shell animate-fade-in">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <span className="chip-accent">
            <Sparkles size={14} aria-hidden /> Learner onboarding
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {learnerName ? (
              <>
                Welcome, <span className="text-gradient">{learnerName}</span>
              </>
            ) : (
              <>Build your personalised learning path</>
            )}
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            These preferences shape lesson tone, pacing, and the initial mastery estimate.
            You can change them later.
          </p>
        </div>

        <form className="panel p-6 sm:p-7" onSubmit={submit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Dropdown
                label="Target subject"
                icon={<GraduationCap size={16} aria-hidden />}
                options={SUBJECT_OPTIONS}
                value={subjectDropdownValue}
                onChange={(value) => update("subject", value === "__custom__" ? "" : value)}
              />
              {isCustomSubject ? (
                <label className="mt-3 block">
                  <span className="field-label">Custom subject</span>
                  <input
                    className="input-field"
                    value={form.subject}
                    onChange={(event) => update("subject", event.target.value)}
                    required
                    autoFocus
                    placeholder="e.g. Quantum computing, Music theory…"
                  />
                </label>
              ) : null}
            </div>
            <label className="md:col-span-2">
              <span className="field-label">Learning goal</span>
              <textarea
                className="input-field min-h-24"
                value={form.goal}
                onChange={(event) => update("goal", event.target.value)}
                required
              />
            </label>

            <Dropdown
              label="Current self-rated level"
              icon={<Gauge size={16} aria-hidden />}
              options={LEVEL_OPTIONS}
              value={form.selfRatedLevel}
              onChange={(value) => update("selfRatedLevel", value)}
            />
            <Dropdown
              label="Preferred learning style"
              icon={<BookOpen size={16} aria-hidden />}
              options={STYLE_OPTIONS}
              value={form.preferredStyle}
              onChange={(value) => update("preferredStyle", value)}
            />
            <Dropdown
              label="Daily available time"
              icon={<Clock size={16} aria-hidden />}
              options={TIME_OPTIONS}
              value={String(form.dailyTimeMinutes)}
              onChange={(value) => update("dailyTimeMinutes", Number(value))}
            />
            <div className="hidden md:block" />
          </div>

          {error ? <p className="danger-note mt-5">{error}</p> : null}

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              className="accent-button relative overflow-hidden"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <span className="pointer-events-none absolute inset-0 shimmer-bg" aria-hidden />
              ) : null}
              <UserRound size={18} aria-hidden />
              {loading ? (
                <AIGeneratingDots label="calibrating your path" />
              ) : (
                "Start assessment"
              )}
              <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
