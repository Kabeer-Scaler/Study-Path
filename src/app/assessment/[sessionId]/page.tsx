"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";

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
        <div className="panel p-6">Loading assessment...</div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">Adaptive intake assessment</p>
            <h1 className="mt-1 text-3xl font-bold">Find your knowledge gaps</h1>
            <p className="mt-2 text-slate-600">
              The next question changes based on your answer and current confidence.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
            {answeredCount}/10+ answered
          </div>
        </div>

        <div className="mb-5 h-3 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-teal-600" style={{ width: `${progress}%` }} />
        </div>

        {error ? <p className="danger-note mb-4">{error}</p> : null}

        {complete ? (
          <section className="panel p-6">
            <CheckCircle2 size={34} className="text-teal-700" aria-hidden />
            <h2 className="mt-4 text-2xl font-bold">Assessment complete</h2>
            <p className="mt-2 text-slate-600">
              Your concept-level mastery scores are ready.
            </p>
            <Link className="primary-button mt-5" href={`/results/${userId}`}>
              View results
              <ArrowRight size={18} aria-hidden />
            </Link>
          </section>
        ) : question ? (
          <form className="panel p-6" onSubmit={submit}>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                {question.conceptId}
              </span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
                difficulty {question.difficulty}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                {question.type.replace("_", " ")}
              </span>
            </div>
            <pre className="mt-5 whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-lg font-semibold leading-8 text-slate-950">
              {question.question}
            </pre>
            {question.options?.length ? (
              <div className="mt-5 grid gap-3">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 hover:border-teal-500"
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={answer === option}
                      onChange={(event) => setAnswer(event.target.value)}
                      disabled={Boolean(feedback)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
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
              <div className={`mt-5 ${feedback.isCorrect ? "success-note" : "danger-note"}`}>
                <p className="font-semibold">{feedback.feedback}</p>
                <p className="mt-1">{feedback.explanation}</p>
              </div>
            ) : null}
            {feedback ? (
              <button className="primary-button mt-6" type="button" onClick={moveNext}>
                {pendingComplete ? "Finish assessment" : "Next question"}
                <ArrowRight size={18} aria-hidden />
              </button>
            ) : (
              <button className="primary-button mt-6" disabled={loading} type="submit">
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
