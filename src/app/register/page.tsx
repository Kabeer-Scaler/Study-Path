"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, UserPlus } from "lucide-react";
import { AuroraBackground } from "@/components/AuroraBackground";
import { NeuralOrbs } from "@/components/NeuralOrbs";
import { AIGeneratingDots } from "@/components/AIGeneratingDots";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not register.");
      return;
    }
    router.push("/login");
  }

  return (
    <main className="app-page relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient -z-20" />
      <AuroraBackground intensity="soft" />
      <NeuralOrbs count={4} />
      <div className="compact-page-shell flex h-full items-center justify-center">
        <div className="mx-auto w-full max-w-md animate-scale-in">
          <div className="mb-4 text-center">
            <span className="chip-accent mx-auto">
              <Sparkles size={14} aria-hidden /> Create account
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
              Start your learning journey
            </h1>
          </div>

          <form className="panel panel-hover p-5 sm:p-6" onSubmit={submit}>
            <div className="grid gap-4">
              <label>
                <span className="field-label">Name</span>
                <input
                  className="input-field"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
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
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <span className="mt-1 block text-xs text-muted">
                  At least 8 characters.
                </span>
              </label>
            </div>

            {error ? <p className="danger-note mt-4">{error}</p> : null}

            <button
              className="accent-button relative mt-5 w-full overflow-hidden"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <span className="pointer-events-none absolute inset-0 shimmer-bg" aria-hidden />
              ) : null}
              <UserPlus size={18} aria-hidden />
              {loading ? <AIGeneratingDots label="creating account" /> : "Create account"}
            </button>

            <p className="mt-4 text-center text-sm text-muted">
              Already registered?{" "}
              <Link className="font-semibold text-ink underline-offset-4 hover:underline" href="/login">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
