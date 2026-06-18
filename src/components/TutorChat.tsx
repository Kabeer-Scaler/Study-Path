"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type { TutorMessage } from "@/lib/types";
import { TypewriterText } from "@/components/TypewriterText";
import { ShimmerText } from "@/components/ShimmerText";
import { AIGeneratingDots } from "@/components/AIGeneratingDots";

export function TutorChat({
  userId,
  lessonId,
  initialMessages
}: {
  userId: string;
  lessonId: string;
  initialMessages: TutorMessage[];
}) {
  const [messages, setMessages] = useState<TutorMessage[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialIdsRef = useRef<Set<string>>(
    new Set(initialMessages.map((m) => m.id))
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    setMessage("");
    setLoading(true);
    setError("");
    const optimistic: TutorMessage = {
      id: `local_${Date.now()}`,
      userId,
      lessonId,
      role: "user",
      message: text,
      createdAt: new Date().toISOString()
    };
    setMessages((items) => [...items, optimistic]);
    const response = await fetch("/api/tutor/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, lessonId, message: text })
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Tutor could not respond.");
      setMessage(text);
      return;
    }
    setMessages(payload.messages);
  }

  return (
    <aside className="panel flex h-full max-h-full min-h-0 flex-col overflow-hidden p-4">
      <div className="flex shrink-0 items-center gap-3 border-b border-line pb-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-bg shadow-soft">
          <Sparkles size={18} aria-hidden />
        </span>
        <div>
          <h2 className="font-bold">
            <ShimmerText>Socratic Tutor</ShimmerText>
          </h2>
          <p className="text-xs text-muted">Guides first, explains after attempts</p>
        </div>
      </div>
      <div ref={scrollRef} className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface-muted p-4 text-sm text-muted">
            Ask a question like "Can you just tell me what this loop prints?"
          </div>
        ) : null}
        {messages.map((item) => {
          const isUser = item.role === "user";
          const isFresh = !initialIdsRef.current.has(item.id);
          const strategyLabel =
            item.tutorStrategy === "hint"
              ? "Hint"
              : item.tutorStrategy === "explanation"
                ? "Explaining"
                : item.tutorStrategy === "guiding_question"
                  ? "Guiding"
                  : null;
          return (
            <div
              key={item.id}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-soft ${
                isUser
                  ? "ml-auto bg-blue-slate text-vanilla-cream animate-fade-up"
                  : "mr-auto border border-line bg-surface-muted text-ink animate-fade-in"
              }`}
            >
              {!isUser && strategyLabel ? (
                <span className="mb-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  {strategyLabel}
                </span>
              ) : null}
              {!isUser && isFresh ? (
                <TypewriterText text={item.message} speedMs={14} cursor={false} />
              ) : (
                item.message
              )}
            </div>
          );
        })}
        {loading ? (
          <div className="mr-auto max-w-[60%] rounded-2xl border border-line bg-surface-muted px-3.5 py-2.5 text-sm text-muted animate-fade-in">
            <AIGeneratingDots label="thinking" />
          </div>
        ) : null}
      </div>
      {error ? <p className="danger-note mt-3 shrink-0">{error}</p> : null}
      <form
        className="mt-4 flex shrink-0 gap-2 rounded-xl ring-focus-ai transition"
        onSubmit={send}
      >
        <label className="sr-only" htmlFor="tutor-message">
          Tutor message
        </label>
        <input
          id="tutor-message"
          className="input-field mt-0"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask for a hint..."
        />
        <button className="accent-button px-3" disabled={loading} type="submit">
          <Send size={18} aria-hidden />
          <span className="sr-only">Send</span>
        </button>
      </form>
    </aside>
  );
}
