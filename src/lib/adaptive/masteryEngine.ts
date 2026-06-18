import { clamp } from "@/lib/db/store";
import type { Difficulty } from "@/lib/types";

const difficultyWeights: Record<Difficulty, number> = {
  1: 0.8,
  2: 1,
  3: 1.2
};

export function updateAssessmentMastery(
  currentMastery: number,
  isCorrect: boolean,
  difficulty: Difficulty
) {
  const weight = difficultyWeights[difficulty];
  const delta = isCorrect ? 0.15 * weight : -0.18 * weight;
  const diagnosticFloor: Record<Difficulty, number> = {
    1: 0.62,
    2: 0.68,
    3: 0.74
  };
  const diagnosticCeiling: Record<Difficulty, number> = {
    1: 0.42,
    2: 0.36,
    3: 0.3
  };

  const updated = currentMastery + delta;
  if (isCorrect) {
    return clamp(Number(Math.max(updated, diagnosticFloor[difficulty]).toFixed(2)));
  }

  return clamp(Number(Math.min(updated, diagnosticCeiling[difficulty]).toFixed(2)));
}

export function updateAssessmentConfidence({
  currentConfidence,
  isCorrect,
  previousConceptAnswers
}: {
  currentConfidence: number;
  isCorrect: boolean;
  previousConceptAnswers: Array<{ isCorrect: boolean }>;
}) {
  const hadCorrect = previousConceptAnswers.some((answer) => answer.isCorrect);
  const hadIncorrect = previousConceptAnswers.some((answer) => !answer.isCorrect);
  const inconsistent =
    previousConceptAnswers.length > 0 &&
    ((isCorrect && hadIncorrect) || (!isCorrect && hadCorrect));
  const delta = inconsistent ? -0.08 : isCorrect ? 0.16 : 0.08;
  return clamp(Number((currentConfidence + delta).toFixed(2)));
}

export function applyAssessmentAntiGamingCap({
  proposedMastery,
  evidenceCount,
  confidence
}: {
  proposedMastery: number;
  evidenceCount: number;
  confidence: number;
}) {
  if (evidenceCount < 2 || confidence < 0.7) {
    return Math.min(proposedMastery, 0.84);
  }
  return proposedMastery;
}

export function updateLessonMastery(currentMastery: number, quizScore: number) {
  if (quizScore >= 85) return clamp(Number((currentMastery + 0.15).toFixed(2)));
  if (quizScore >= 60) return clamp(Number((currentMastery + 0.05).toFixed(2)));
  return clamp(Number((currentMastery - 0.05).toFixed(2)));
}

export function lessonStatusFromScore(quizScore: number) {
  if (quizScore >= 85) return "mastered" as const;
  if (quizScore >= 60) return "completed" as const;
  return "needs_review" as const;
}

export function initialMasteryForLevel(level: string, conceptId: string) {
  const normalized = level.toLowerCase();
  if (normalized.includes("advanced")) return 0.72;
  if (normalized.includes("intermediate")) {
    if (["variables", "operators", "conditionals", "loops"].includes(conceptId)) {
      return 0.65;
    }
    return 0.42;
  }
  if (normalized.includes("absolute")) return 0.16;
  return 0.32;
}
