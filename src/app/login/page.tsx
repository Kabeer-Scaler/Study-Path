"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles } from "lucide-react";
import { AuroraBackground } from "@/components/AuroraBackground";
import { NeuralOrbs } from "@/components/NeuralOrbs";
import { AIGeneratingDots } from "@/components/AIGeneratingDots";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not sign in.");
      return;
    }
    router.push(payload.needsOnboarding ? "/onboarding" : `/dashboard/${payload.userId}`);
  }

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient -z-20" />
      <AuroraBackground intensity="soft" />
      <NeuralOrbs count={4} />
      <div className="page-shell">
        <div className="mx-auto max-w-md animate-scale-in">
          <div className="mb-6 text-center">
            <span className="chip-highlight mx-auto">
              <Sparkles size={14} aria-hidden /> Welcome back
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
              Continue your learning path
            </h1>
            <p className="mt-2 text-muted">
              Sign in to access your assessment, curriculum, tutor chats, and progress.
            </p>
          </div>

          <form className="panel panel-hover p-6 sm:p-7" onSubmit={submit}>
            <div className="grid gap-5">
              <label>
                <span className="field-label">Email</span>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                <span className="field-label">Password</span>
                <input
                  className="input-field"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
            </div>

            {error ? <p className="danger-note mt-5">{error}</p> : null}

            <button
              className={`accent-button relative mt-6 w-full overflow-hidden ${loading ? "" : ""}`}
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <span className="pointer-events-none absolute inset-0 shimmer-bg" aria-hidden />
              ) : null}
              <LogIn size={18} aria-hidden />
              {loading ? <AIGeneratingDots label="signing in" /> : "Sign in"}
            </button>

            <p className="mt-5 text-center text-sm text-muted">
              New here?{" "}
              <Link className="font-semibold text-ink underline-offset-4 hover:underline" href="/register">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
