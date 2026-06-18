"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

type PublicQuestion = {
  questionId: string;
  conceptId: string;
  conceptName?: string;
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
    correctAnswer: string;
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
      feedback: payload.feedback,
      correctAnswer: payload.correctAnswer
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
      <main className="compact-page-shell app-page">
        <div className="panel p-4 animate-pulse">Loading assessment...</div>
      </main>
    );
  }

  return (
    <main className="compact-page-shell app-page animate-fade-in overflow-hidden">
      <div className="mx-auto w-full max-w-3xl">
        <div className="page-header-compact shrink-0">
          <div>
            <h1>Find your knowledge gaps</h1>
            <p className="hidden text-sm text-muted sm:block">
              Questions adapt to your answers and confidence.
            </p>
          </div>
          <span className="chip-secondary shrink-0 tabular-nums">
            {answeredCount}/10+ answered
          </span>
        </div>

        <div className="mb-3 h-1.5 shrink-0 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {error ? <p className="danger-note mb-2 shrink-0 py-2 text-sm">{error}</p> : null}

        {complete ? (
          <section className="panel p-6 text-center animate-scale-in">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-icy-aqua/40">
              <CheckCircle2 size={28} className="text-blue-slate" aria-hidden />
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-ink">Assessment complete</h2>
            <p className="mt-1 text-sm text-muted">Your mastery scores are ready.</p>
            <Link className="accent-button mx-auto mt-4 inline-flex" href={`/results/${userId}`}>
              View results
              <ArrowRight size={18} aria-hidden />
            </Link>
          </section>
        ) : question ? (
          <form className="panel p-4 sm:p-5 animate-fade-in" onSubmit={submit}>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              <span className="chip-accent">
                {question.conceptName ?? question.conceptId}
              </span>
              <span className="chip-secondary">difficulty {question.difficulty}</span>
              <span className="chip-highlight">{question.type.replace("_", " ")}</span>
            </div>
            <p className="mt-3 shrink-0 rounded-xl border border-line bg-surface-muted p-3 text-base font-semibold leading-snug text-ink">
              {question.question}
            </p>
            {question.options?.length ? (
              <div className="mt-3 grid gap-2">
                {question.options.map((option) => {
                  const checked = answer === option;
                  const isCorrectOption =
                    Boolean(feedback) && option === feedback?.correctAnswer;
                  const isWrongPick =
                    Boolean(feedback) && checked && !feedback?.isCorrect;
                  return (
                    <label
                      key={option}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition ${
                        feedback
                          ? "cursor-default"
                          : "cursor-pointer hover:border-accent hover:bg-accent/5"
                      } ${
                        isCorrectOption
                          ? "border-highlight bg-highlight/15 text-ink"
                          : isWrongPick
                            ? "border-warn bg-warn/15 text-ink"
                            : checked
                              ? "border-accent bg-accent/10"
                              : "border-line bg-surface"
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={checked}
                        onChange={(event) => setAnswer(event.target.value)}
                        disabled={Boolean(feedback)}
                        className="accent-accent"
                      />
                      <span className="flex-1">{option}</span>
                      {isCorrectOption ? (
                        <CheckCircle2 size={16} className="text-highlight" aria-hidden />
                      ) : null}
                      {isWrongPick ? (
                        <XCircle size={16} className="text-warn" aria-hidden />
                      ) : null}
                    </label>
                  );
                })}
              </div>
            ) : (
              <label className="mt-3 block shrink-0">
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
              <div
                className={`mt-3 shrink-0 text-sm ${feedback.isCorrect ? "success-note" : "danger-note"} animate-fade-in`}
              >
                <p className="font-semibold">{feedback.feedback}</p>
                <p className="mt-0.5">{feedback.explanation}</p>
              </div>
            ) : null}
            <div className="mt-4">
              {feedback ? (
                <button className="accent-button" type="button" onClick={moveNext}>
                  {pendingComplete ? "Finish assessment" : "Next question"}
                  <ArrowRight size={18} aria-hidden />
                </button>
              ) : (
                <button className="accent-button" disabled={loading} type="submit">
                  {loading ? "Checking..." : "Submit answer"}
                  <ArrowRight size={18} aria-hidden />
                </button>
              )}
            </div>
          </form>
        ) : null}
      </div>
    </main>
  );
}
