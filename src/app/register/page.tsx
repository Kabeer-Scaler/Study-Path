"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

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
    <main className="page-shell">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-700">Create account</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Register before starting
          </h1>
          <p className="mt-2 text-slate-600">
            Your account keeps your assessment, curriculum, tutor chats, and progress separate.
          </p>
        </div>

        <form className="panel p-5" onSubmit={submit}>
          <div className="grid gap-5">
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
            </label>
          </div>

          {error ? <p className="danger-note mt-5">{error}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="primary-button" disabled={loading} type="submit">
              <UserPlus size={18} aria-hidden />
              {loading ? "Creating..." : "Create account"}
            </button>
            <Link className="secondary-button" href="/login">
              Already registered
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
