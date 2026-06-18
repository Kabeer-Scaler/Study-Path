"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { TutorChat } from "@/components/TutorChat";
import type { Concept, Lesson, Module, TutorMessage, User } from "@/lib/types";

type LessonPayload = {
  lesson: Lesson;
  module?: Module;
  user?: User;
  concept?: Concept;
  mastery: number;
  tutorMessages: TutorMessage[];
};

export function LessonExperience({ payload }: { payload: LessonPayload }) {
  const { lesson, user, concept } = payload;
  const [practiceVisible, setPracticeVisible] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    recommendation: string;
    graded: Array<{
      questionId: string;
      isCorrect: boolean;
      correctAnswer: string;
      explanation: string;
    }>;
  }>();
  const [status, setStatus] = useState(lesson.status);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user || !concept) {
    return <div className="page-shell">Lesson data is incomplete.</div>;
  }

  async function submitQuiz() {
    const missing = lesson.content.quiz.some(
      (question) => !answers[question.questionId]?.trim()
    );
    if (missing) {
      setError("Please select or enter an answer before continuing.");
      return;
    }
    setLoading(true);
    setError("");
    const response = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?.id,
        lessonId: lesson.id,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer
        }))
      })
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(result.error ?? "Could not submit quiz.");
      return;
    }
    setQuizResult(result);
    setStatus(
      result.score >= 85 ? "mastered" : result.score >= 60 ? "completed" : "needs_review"
    );
  }

  async function completeLesson() {
    setLoading(true);
    const response = await fetch(`/api/lessons/${lesson.id}/complete`, {
      method: "POST"
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(result.error ?? "Could not complete lesson.");
      return;
    }
    setStatus(result.lesson.status);
  }

  return (
    <main className="page-shell animate-fade-in">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="chip-accent">
            <Sparkles size={14} aria-hidden /> {concept.name}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {lesson.title}
          </h1>
          <p className="mt-2 max-w-3xl text-muted">{lesson.whyAssigned}</p>
        </div>
        <Link className="secondary-button" href={`/dashboard/${user.id}`}>
          Dashboard
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <article className="space-y-5">
          <section className="gradient-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip-highlight">
                Mastery {Math.round(payload.mastery * 100)}%
              </span>
              <span className="chip-secondary">
                Status {status.replace("_", " ")}
              </span>
              <span className="chip-accent">
                {lesson.estimatedMinutes} min
              </span>
            </div>
            <h2 className="mt-5 text-xl font-bold text-ink">Objective</h2>
            <p className="mt-2 text-ink/90">{lesson.content.learningObjective}</p>
          </section>

          <section className="panel p-5 sm:p-6">
            <h2 className="text-xl font-bold text-ink">Lesson</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="subtle-panel p-4">
                <p className="text-sm font-bold text-ink">Explanation</p>
                <p className="mt-2 text-sm leading-6 text-ink/85">
                  {lesson.content.explanation}
                </p>
              </div>
              <div className="subtle-panel p-4">
                <p className="text-sm font-bold text-ink">Analogy</p>
                <p className="mt-2 text-sm leading-6 text-ink/85">
                  {lesson.content.analogy}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="font-semibold text-ink">Example</p>
              <p className="mt-2 text-ink/85">{lesson.content.example}</p>
              <pre className="code-block mt-3">
                <code>{lesson.content.codeExample}</code>
              </pre>
            </div>
            <div className="mt-4 rounded-xl border border-powder-blush/60 bg-powder-blush/20 p-4">
              <p className="font-semibold text-ink">Common mistake</p>
              <p className="mt-1 text-sm text-ink/85">{lesson.content.commonMistake}</p>
            </div>
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <CircleHelp size={20} className="text-accent" aria-hidden />
              <h2 className="text-xl font-bold text-ink">Inline practice</h2>
            </div>
            <p className="mt-3 font-semibold text-ink">
              {lesson.content.practiceQuestion.question}
            </p>
            {lesson.content.practiceQuestion.code ? (
              <pre className="code-block mt-3">
                <code>{lesson.content.practiceQuestion.code}</code>
              </pre>
            ) : null}
            <p className="mt-3 text-sm text-muted">
              Hint: {lesson.content.practiceQuestion.hint}
            </p>
            <button
              className="secondary-button mt-4"
              type="button"
              onClick={() => setPracticeVisible((value) => !value)}
            >
              <RotateCcw size={17} aria-hidden />
              {practiceVisible ? "Hide answer" : "Check answer"}
            </button>
            {practiceVisible ? (
              <p className="success-note mt-3 animate-fade-in">
                Answer: {lesson.content.practiceQuestion.answer}
              </p>
            ) : null}
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={20} className="text-accent" aria-hidden />
              <h2 className="text-xl font-bold text-ink">End-of-lesson quiz</h2>
            </div>
            <div className="mt-4 space-y-5">
              {lesson.content.quiz.map((question, index) => (
                <div key={question.questionId} className="subtle-panel p-4">
                  <p className="font-semibold text-ink">
                    {index + 1}. {question.question}
                  </p>
                  {question.options?.length ? (
                    <div className="mt-3 grid gap-2">
                      {question.options.map((option) => {
                        const checked = answers[question.questionId] === option;
                        return (
                          <label
                            key={option}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-surface px-3 py-2 text-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-soft ${
                              checked ? "border-accent bg-accent/10" : "border-line"
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.questionId}
                              value={option}
                              checked={checked}
                              onChange={(event) =>
                                setAnswers((items) => ({
                                  ...items,
                                  [question.questionId]: event.target.value
                                }))
                              }
                            />
                            {option}
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      className="input-field"
                      value={answers[question.questionId] ?? ""}
                      onChange={(event) =>
                        setAnswers((items) => ({
                          ...items,
                          [question.questionId]: event.target.value
                        }))
                      }
                      placeholder="Type your answer"
                    />
                  )}
                  {quizResult ? (
                    <div className="mt-3 text-sm">
                      {quizResult.graded.find(
                        (item) => item.questionId === question.questionId
                      )?.isCorrect ? (
                        <p className="font-semibold text-ink">Correct</p>
                      ) : (
                        <p className="font-semibold text-accent">
                          Review: {question.correctAnswer}
                        </p>
                      )}
                      <p className="mt-1 text-muted">{question.explanation}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            {error ? <p className="danger-note mt-4">{error}</p> : null}
            {quizResult ? (
              <div className="success-note mt-4 animate-fade-in">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 size={18} aria-hidden />
                  Quiz score: {quizResult.score}%
                </div>
                <p className="mt-1">{quizResult.recommendation}</p>
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="accent-button" disabled={loading} onClick={submitQuiz}>
                Submit quiz
              </button>
              <button className="secondary-button" disabled={loading} onClick={completeLesson}>
                Mark lesson complete
              </button>
              <Link className="secondary-button" href={`/curriculum/${user.id}`}>
                Back to curriculum
              </Link>
            </div>
          </section>
        </article>
        <TutorChat
          userId={user.id}
          lessonId={lesson.id}
          initialMessages={payload.tutorMessages}
        />
      </div>
    </main>
  );
}
