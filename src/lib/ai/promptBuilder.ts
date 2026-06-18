import type { Concept } from "@/lib/types";

export type PreferredStyle = "examples" | "code" | "visual";
export type LessonMode = "core" | "remedial" | "challenge";

export function normalizePreferredStyle(preferredStyle: string): PreferredStyle {
  const value = preferredStyle.toLowerCase();
  if (/code|program/i.test(value)) return "code";
  if (/visual|diagram|flow/i.test(value)) return "visual";
  return "examples";
}

export type LessonPromptContext = {
  subject: string;
  conceptId: string;
  conceptName: string;
  conceptDescription?: string;
  mastery: number;
  style: PreferredStyle;
  mode: LessonMode;
  misconceptions?: string[];
  missedQuestions?: string[];
};

export function buildLessonUserPrompt(ctx: LessonPromptContext) {
  const parts = [
    `subject:${ctx.subject}`,
    `conceptId:${ctx.conceptId}`,
    `conceptName:${ctx.conceptName}`,
    `mastery:${ctx.mastery.toFixed(2)}`,
    `style:${ctx.style}`,
    `mode:${ctx.mode}`
  ];
  if (ctx.conceptDescription?.trim()) {
    parts.push(`conceptDescription:${ctx.conceptDescription.trim()}`);
  }
  if (ctx.misconceptions?.length) {
    parts.push(`misconceptions:${ctx.misconceptions.join("; ")}`);
  }
  if (ctx.missedQuestions?.length) {
    parts.push(`missedQuestions:${ctx.missedQuestions.join("; ")}`);
  }
  parts.push(
    `quizIds:lesson_${ctx.conceptId}_ai_q1,lesson_${ctx.conceptId}_ai_q2,lesson_${ctx.conceptId}_ai_q3`
  );
  return parts.join("|");
}

export type TutorPromptContext = {
  subject: string;
  lessonTitle: string;
  conceptName: string;
  mastery: number;
  userTurns: number;
  misconception?: string;
  message: string;
  learningObjective?: string;
  explanationExcerpt?: string;
  practiceQuestion?: string;
};

export function buildTutorUserPrompt(ctx: TutorPromptContext) {
  const parts = [
    `subject:${ctx.subject}`,
    `lesson:${ctx.lessonTitle}`,
    `concept:${ctx.conceptName}`,
    `mastery:${ctx.mastery.toFixed(2)}`,
    `userTurns:${ctx.userTurns}`,
    `misconception:${ctx.misconception ?? "none"}`,
    `message:${ctx.message}`
  ];
  if (ctx.learningObjective?.trim()) {
    parts.push(`objective:${ctx.learningObjective.trim()}`);
  }
  if (ctx.explanationExcerpt?.trim()) {
    parts.push(`excerpt:${ctx.explanationExcerpt.trim().slice(0, 400)}`);
  }
  if (ctx.practiceQuestion?.trim()) {
    parts.push(`practiceStem:${ctx.practiceQuestion.trim()}`);
  }
  parts.push(`output:{"reply":"","tutorStrategy":"guiding_question|hint|explanation"}`);
  return parts.join("|");
}

export function buildSubjectDomainUserPrompt(subject: string, guidance: string, retry = false) {
  const base = `subject:${subject}|guidance:${guidance}|concepts:5|output:concepts+questions JSON per schema`;
  return retry ? `${base}|retry:fix validation failures` : base;
}

export function buildAssessmentQuestionUserPrompt(
  subject: string,
  guidance: string,
  concept: Pick<Concept, "id" | "name" | "description">
) {
  return [
    `subject:${subject}`,
    `guidance:${guidance}`,
    `conceptId:${concept.id}`,
    `conceptName:${concept.name}`,
    `description:${concept.description}`,
    `questions:3`,
    `difficulties:1,2,3`
  ].join("|");
}
