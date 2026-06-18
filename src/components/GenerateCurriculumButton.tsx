"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { AIGeneratingDots } from "@/components/AIGeneratingDots";

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
      <button
        className={`accent-button relative w-full overflow-hidden ${
          loading ? "" : "animate-pulse-glow"
        }`}
        disabled={loading}
        onClick={generate}
      >
        {loading ? (
          <span className="pointer-events-none absolute inset-0 shimmer-bg" aria-hidden />
        ) : null}
        <Sparkles size={18} aria-hidden className={loading ? "animate-spin" : ""} />
        {loading ? (
          <AIGeneratingDots label="synthesizing your path" />
        ) : (
          "Generate curriculum"
        )}
      </button>
      {error ? <p className="danger-note">{error}</p> : null}
    </div>
  );
}
