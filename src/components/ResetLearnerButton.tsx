"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function ResetLearnerButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function reset() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/users/${userId}/reset`, { method: "POST" });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not reset learner.");
      return;
    }
    router.push("/onboarding");
  }

  return (
    <div className="space-y-2">
      <button className="secondary-button" disabled={loading} onClick={reset} type="button">
        <Trash2 size={17} aria-hidden />
        {loading ? "Resetting..." : "Reset learner data"}
      </button>
      {error ? <p className="danger-note">{error}</p> : null}
    </div>
  );
}
