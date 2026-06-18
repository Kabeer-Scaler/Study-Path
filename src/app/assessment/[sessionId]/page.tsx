"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

type PublicQuestion = {
  questionId: string;
  conceptId: string;
  question: string;
  type: string;
  options?: string[];
  difficulty: number;
};

export default function AssessmentPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const [question, setQuestion] = useState<PublicQuestion>();
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
    feedback: string;
  }>();
  const [pendingNextQuestion, setPendingNextQuestion] = useState<PublicQuestion>();
  const [pendingComplete, setPendingComplete] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [complete, setComplete] = useState(false);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const response = await fetch(`/api/assessment/${sessionId}`, {
        cache: "no-store"
      });
      const payload = await response.json();
      setLoading(false);
      if (!response.ok) {
        setError(payload.error ?? "Assessment not found.");
        return;
      }
      setQuestion(payload.currentQuestion);
      setAnsweredCount(payload.answeredCount);
      setComplete(payload.isComplete);
      setPendingNextQuestion(undefined);
      setPendingComplete(false);
      setUserId(payload.userId);
    }
    load();
  }, [sessionId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answer.trim() || !question) {
      setError("Please select or enter an answer before continuing.");
      return;
    }
    setError("");
    setLoading(true);
    const response = await fetch("/api/assessment/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        questionId: question.questionId,
        answer
      })
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not submit answer.");
      return;
    }
    setFeedback({
      isCorrect: payload.isCorrect,
      explanation: payload.explanation,
      feedback: payload.feedback
    });
    setPendingNextQuestion(payload.nextQuestion);
    setPendingComplete(payload.isComplete);
    setAnsweredCount(payload.answeredCount);
    setUserId(payload.userId);
  }

  function moveNext() {
    setFeedback(undefined);
    setAnswer("");
    if (pendingComplete) {
      setQuestion(undefined);
      setComplete(true);
    } else {
      setQuestion(pendingNextQuestion);
    }
    setPendingNextQuestion(undefined);
    setPendingComplete(false);
  }

  const progress = Math.min(100, Math.round((answeredCount / 10) * 100));

  if (loading && !question && !complete) {
    return (
      <main className="page-shell">
        <div className="panel p-6 animate-pulse">Loading assessment...</div>
      </main>
    );
  }

  return (
    <main className="page-shell animate-fade-in">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="chip-accent">
              <Sparkles size={14} aria-hidden /> Adaptive intake assessment
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
              Find your knowledge gaps
            </h1>
            <p className="mt-2 text-muted">
              The next question changes based on your answer and current confidence.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-ink shadow-soft">
            {answeredCount}/10+ answered
          </div>
        </div>

        <div className="mb-6 h-3 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-powder-blush via-light-blue to-icy-aqua transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {error ? <p className="danger-note mb-4">{error}</p> : null}

        {complete ? (
          <section className="panel p-8 text-center animate-scale-in">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-icy-aqua/40">
              <CheckCircle2 size={32} className="text-blue-slate" aria-hidden />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-ink">Assessment complete</h2>
            <p className="mt-2 text-muted">
              Your concept-level mastery scores are ready.
            </p>
            <Link className="accent-button mx-auto mt-6 inline-flex" href={`/results/${userId}`}>
              View results
              <ArrowRight size={18} aria-hidden />
            </Link>
          </section>
        ) : question ? (
          <form className="panel p-6 sm:p-7 animate-fade-in" onSubmit={submit}>
            <div className="flex flex-wrap gap-2">
              <span className="chip-accent">{question.conceptId}</span>
              <span className="chip-secondary">difficulty {question.difficulty}</span>
              <span className="chip-highlight">{question.type.replace("_", " ")}</span>
            </div>
            <pre className="mt-5 whitespace-pre-wrap rounded-xl border border-line bg-surface-muted p-4 text-lg font-semibold leading-8 text-ink">
              {question.question}
            </pre>
            {question.options?.length ? (
              <div className="mt-5 grid gap-3">
                {question.options.map((option) => {
                  const checked = answer === option;
                  return (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-surface px-3.5 py-3 text-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-glow ${
                        checked
                          ? "border-accent bg-accent/10 shadow-soft"
                          : "border-line"
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={checked}
                        onChange={(event) => setAnswer(event.target.value)}
                        disabled={Boolean(feedback)}
                        className="accent-powder-blush"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <label className="mt-5 block">
                <span className="field-label">Your answer</span>
                <input
                  className="input-field"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Type your answer"
                  disabled={Boolean(feedback)}
                />
              </label>
            )}
            {feedback ? (
              <div className={`mt-5 ${feedback.isCorrect ? "success-note" : "danger-note"} animate-fade-in`}>
                <p className="font-semibold">{feedback.feedback}</p>
                <p className="mt-1">{feedback.explanation}</p>
              </div>
            ) : null}
            {feedback ? (
              <button className="accent-button mt-6" type="button" onClick={moveNext}>
                {pendingComplete ? "Finish assessment" : "Next question"}
                <ArrowRight size={18} aria-hidden />
              </button>
            ) : (
              <button className="accent-button mt-6" disabled={loading} type="submit">
                {loading ? "Checking..." : "Submit answer"}
                <ArrowRight size={18} aria-hidden />
              </button>
            )}
          </form>
        ) : null}
      </div>
    </main>
  );
}
