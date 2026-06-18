"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  RotateCcw,
  Sparkles,
  XCircle
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

const STEPS = [
  { id: 1, label: "Intro" },
  { id: 2, label: "Teach" },
  { id: 3, label: "Practice" },
  { id: 4, label: "Assess" }
] as const;

function firstParagraph(text: string) {
  const paragraph = text.split(/\n\n+/)[0]?.trim();
  return paragraph || text.slice(0, 400);
}

export function LessonExperience({ payload }: { payload: LessonPayload }) {
  const { lesson, user, concept } = payload;
  const [step, setStep] = useState(1);
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

  const introText =
    lesson.content.intro?.trim() ||
    `${lesson.content.learningObjective} ${firstParagraph(lesson.content.explanation)}`;

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
    <main className="compact-page-shell app-page animate-fade-in overflow-hidden">
      <div className="page-header-compact shrink-0">
        <div className="min-w-0">
          <span className="chip-accent">
            <Sparkles size={14} aria-hidden /> {concept.name}
          </span>
          <h1 className="mt-1 truncate">{lesson.title}</h1>
        </div>
        <Link className="secondary-button shrink-0" href={`/dashboard/${user.id}`}>
          Dashboard
        </Link>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-h-0 flex-col overflow-hidden">
          <section className="gradient-card shrink-0 p-4">
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
            <nav className="mt-3 flex flex-wrap gap-1.5" aria-label="Lesson steps">
              {STEPS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                    step === item.id
                      ? "bg-accent text-white"
                      : step > item.id
                        ? "bg-accent/15 text-ink"
                        : "bg-surface text-muted"
                  }`}
                  onClick={() => setStep(item.id)}
                >
                  {item.id}. {item.label}
                </button>
              ))}
            </nav>
          </section>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-0.5">
          {step === 1 ? (
            <section className="panel p-4 sm:p-5">
              <h2 className="text-lg font-bold text-ink">Introduction</h2>
              <p className="mt-2 text-sm font-semibold text-muted">Objective</p>
              <p className="mt-0.5 text-sm text-ink/90">{lesson.content.learningObjective}</p>
              <p className="mt-3 text-sm leading-6 text-ink/90">{introText}</p>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="panel p-4 sm:p-5">
              <h2 className="text-lg font-bold text-ink">Teaching</h2>
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
          ) : null}

          {step === 3 ? (
            <section className="panel p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <CircleHelp size={18} className="text-accent" aria-hidden />
                <h2 className="text-lg font-bold text-ink">Practice</h2>
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
          ) : null}

          {step === 4 ? (
            <section className="panel p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-accent" aria-hidden />
                <h2 className="text-lg font-bold text-ink">Assessment</h2>
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
                          const graded = quizResult?.graded.find(
                            (g) => g.questionId === question.questionId
                          );
                          const isCorrectOption =
                            Boolean(quizResult) && option === question.correctAnswer;
                          const isWrongPick =
                            Boolean(quizResult) && checked && graded && !graded.isCorrect;
                          return (
                            <label
                              key={option}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                                quizResult
                                  ? "cursor-default"
                                  : "cursor-pointer hover:-translate-y-0.5 hover:border-accent hover:shadow-soft"
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
                                name={question.questionId}
                                value={option}
                                checked={checked}
                                disabled={Boolean(quizResult)}
                                onChange={(event) =>
                                  setAnswers((items) => ({
                                    ...items,
                                    [question.questionId]: event.target.value
                                  }))
                                }
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
                      <input
                        className="input-field"
                        value={answers[question.questionId] ?? ""}
                        disabled={Boolean(quizResult)}
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
                          <p className="font-semibold text-highlight">Correct</p>
                        ) : (
                          <p className="font-semibold text-warn">
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
          ) : null}

          {step < 4 ? (
            <div className="flex flex-wrap gap-3">
              {step > 1 ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setStep((value) => value - 1)}
                >
                  <ChevronLeft size={17} aria-hidden />
                  Back
                </button>
              ) : null}
              <button
                className="accent-button"
                type="button"
                onClick={() => setStep((value) => value + 1)}
              >
                Continue
                <ChevronRight size={17} aria-hidden />
              </button>
            </div>
          ) : null}
          </div>
        </div>
        <div className="min-h-0 overflow-hidden lg:max-h-full">
          <TutorChat
            userId={user.id}
            lessonId={lesson.id}
            initialMessages={payload.tutorMessages}
          />
        </div>
      </div>
    </main>
  );
}
