"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function GenerateCurriculumButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/curriculum/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not generate curriculum.");
      return;
    }
    router.push(`/curriculum/${userId}`);
  }

  return (
    <div className="space-y-3">
      <button className="primary-button" disabled={loading} onClick={generate}>
        <Sparkles size={18} aria-hidden />
        {loading ? "Generating path..." : "Generate curriculum"}
      </button>
      {error ? <p className="danger-note">{error}</p> : null}
    </div>
  );
}
