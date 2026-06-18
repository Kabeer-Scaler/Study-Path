"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

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
    <main className="page-shell">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-700">Learner login</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Continue your learning path
          </h1>
          <p className="mt-2 text-slate-600">
            Sign in to access your assessment, curriculum, tutor chats, and progress history.
          </p>
        </div>

        <form className="panel p-5" onSubmit={submit}>
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

          <button className="primary-button mt-6" disabled={loading} type="submit">
            <LogIn size={18} aria-hidden />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
