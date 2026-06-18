"use client";

import { FormEvent, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type { TutorMessage } from "@/lib/types";

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

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    const optimistic: TutorMessage = {
      id: `local_${Date.now()}`,
      userId,
      lessonId,
      role: "user",
      message,
      createdAt: new Date().toISOString()
    };
    setMessages((items) => [...items, optimistic]);
    const response = await fetch("/api/tutor/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, lessonId, message })
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Tutor could not respond.");
      return;
    }
    setMessages(payload.messages);
    setMessage("");
  }

  return (
    <aside className="panel flex min-h-[520px] flex-col p-4">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-indigo-600 text-white">
          <Sparkles size={18} aria-hidden />
        </span>
        <div>
          <h2 className="font-bold text-slate-950">Socratic Tutor</h2>
          <p className="text-xs text-slate-500">Guides first, explains after attempts</p>
        </div>
      </div>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            Ask a question like "Can you just tell me what this loop prints?"
          </div>
        ) : null}
        {messages.map((item) => (
          <div
            key={item.id}
            className={`rounded-md px-3 py-2 text-sm ${
              item.role === "user"
                ? "ml-8 bg-teal-700 text-white"
                : "mr-8 border border-slate-200 bg-slate-50 text-slate-800"
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
      {error ? <p className="danger-note mt-3">{error}</p> : null}
      <form className="mt-4 flex gap-2" onSubmit={send}>
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
        <button className="primary-button px-3" disabled={loading} type="submit">
          <Send size={18} aria-hidden />
          <span className="sr-only">Send</span>
        </button>
      </form>
    </aside>
  );
}
