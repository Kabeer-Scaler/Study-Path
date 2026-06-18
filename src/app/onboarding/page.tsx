"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, UserRound } from "lucide-react";
import { DEFAULT_SUBJECT } from "@/lib/db/seed";

const initialForm = {
  subject: DEFAULT_SUBJECT,
  goal: "Build a clear foundation and practice with examples",
  selfRatedLevel: "Beginner",
  preferredStyle: "Examples and practice",
  dailyTimeMinutes: 30
};

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [learnerName, setLearnerName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <main className="page-shell">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-700">Learner onboarding</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {learnerName ? `Welcome, ${learnerName}` : "Build your personalised learning path"}
          </h1>
          <p className="mt-2 text-slate-600">
            These preferences shape lesson tone, pacing, and the initial mastery estimate.
          </p>
        </div>

        <form className="panel p-5" onSubmit={submit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="field-label">Target subject</span>
              <input
                className="input-field"
                value={form.subject}
                onChange={(event) => update("subject", event.target.value)}
                required
              />
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Learning goal</span>
              <textarea
                className="input-field min-h-24"
                value={form.goal}
                onChange={(event) => update("goal", event.target.value)}
                required
              />
            </label>
            <label>
              <span className="field-label">Current self-rated level</span>
              <select
                className="input-field"
                value={form.selfRatedLevel}
                onChange={(event) => update("selfRatedLevel", event.target.value)}
              >
                <option>Absolute beginner</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label>
              <span className="field-label">Preferred learning style</span>
              <select
                className="input-field"
                value={form.preferredStyle}
                onChange={(event) => update("preferredStyle", event.target.value)}
              >
                <option>Examples and practice</option>
                <option>Code examples</option>
                <option>Practice first</option>
                <option>Theory first</option>
                <option>Visual analogies</option>
              </select>
            </label>
            <label>
              <span className="field-label">Daily available time</span>
              <input
                className="input-field"
                type="number"
                min={10}
                max={120}
                value={form.dailyTimeMinutes}
                onChange={(event) => update("dailyTimeMinutes", Number(event.target.value))}
              />
            </label>
          </div>

          {error ? <p className="danger-note mt-5">{error}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="primary-button" disabled={loading} type="submit">
              <UserRound size={18} aria-hidden />
              {loading ? "Starting..." : "Start Assessment"}
              <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
