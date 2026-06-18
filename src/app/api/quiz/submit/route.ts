import { getMasteryRecord } from "@/lib/adaptive/assessmentEngine";
import { insertRemedialLesson } from "@/lib/adaptive/curriculumEngine";
import {
  recordMasteryEvidence,
  upsertReviewSchedule
} from "@/lib/adaptive/evidenceEngine";
import {
  lessonStatusFromScore,
  updateLessonMastery
} from "@/lib/adaptive/masteryEngine";
import { buildDashboard } from "@/lib/adaptive/recommendationEngine";
import { evaluateAnswer } from "@/lib/ai/AIService";
import { generateLessonWithProvider } from "@/lib/ai/AIService";
import { assertOwnsUser, getAuthenticatedUser, getLessonOwnerId } from "@/lib/auth";
import { makeId, mutateStore, nowIso } from "@/lib/db/store";
import { fail, ok, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type SubmitQuizInput = {
  userId?: string;
  lessonId?: string;
  answers?: Array<{ questionId: string; answer: string }>;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<SubmitQuizInput>(request);
    if (!body.userId || !body.lessonId) return fail("Missing userId or lessonId.");
    if (!body.answers?.length) return fail("Please answer the quiz before submitting.");

    const response = await mutateStore(async (store) => {
      const authUser = getAuthenticatedUser(store, request);
      assertOwnsUser(authUser, body.userId);
      assertOwnsUser(authUser, getLessonOwnerId(store, body.lessonId));
      const user = store.users.find((item) => item.id === body.userId);
      const lesson = store.lessons.find((item) => item.id === body.lessonId);
      if (!user || !lesson) throw new Error("User or lesson not found.");

      const quiz = lesson.content.quiz;
      const graded = quiz.map((question) => {
        const submitted = body.answers?.find(
          (answer) => answer.questionId === question.questionId
        );
        const evaluation = evaluateAnswer(
          { ...question, conceptId: lesson.conceptId },
          submitted?.answer ?? ""
        );
        return {
          questionId: question.questionId,
          isCorrect: evaluation.isCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          misconception: evaluation.misconception
        };
      });

      const correctAnswers = graded.filter((item) => item.isCorrect).length;
      const score = Math.round((correctAnswers / quiz.length) * 100);
      const mastery = getMasteryRecord(store, user.id, lesson.conceptId);
      const previousMastery = mastery.masteryScore;
      const previousConfidence = mastery.confidence;
      mastery.masteryScore = updateLessonMastery(mastery.masteryScore, score);
      mastery.confidence = Math.min(1, Number((mastery.confidence + 0.1).toFixed(2)));
      mastery.updatedAt = nowIso();
      lesson.status = lessonStatusFromScore(score);

      const attempt = {
        id: makeId("quiz"),
        userId: user.id,
        lessonId: lesson.id,
        conceptId: lesson.conceptId,
        score,
        totalQuestions: quiz.length,
        correctAnswers,
        createdAt: nowIso()
      };
      store.quizAttempts.push(attempt);

      const misconception = graded.find((item) => item.misconception)?.misconception;
      recordMasteryEvidence(store, {
        userId: user.id,
        conceptId: lesson.conceptId,
        previousMastery,
        newMastery: mastery.masteryScore,
        previousConfidence,
        newConfidence: mastery.confidence,
        reason: `Scored ${score}% on ${lesson.title}.`,
        source: lesson.isChallenge ? "challenge" : "quiz_attempt",
        sourceId: attempt.id,
        misconception
      });
      upsertReviewSchedule(store, {
        userId: user.id,
        conceptId: lesson.conceptId,
        mastery: mastery.masteryScore,
        improved: mastery.masteryScore > previousMastery
      });

      let insertedLesson;
      if (score < 60) {
        insertedLesson = insertRemedialLesson(store, lesson, user);
        const concept = store.concepts.find((item) => item.id === lesson.conceptId);
        if (insertedLesson && concept) {
          const misconceptions = graded
            .map((item) => item.misconception)
            .filter((value): value is string => Boolean(value));
          const missedQuestions = quiz
            .filter((question, index) => !graded[index]?.isCorrect)
            .map((question) => question.question);
          insertedLesson.content = await generateLessonWithProvider(
            concept,
            mastery.masteryScore,
            user.preferredStyle,
            { mode: "remedial", misconceptions, missedQuestions }
          );
        }
      }

      store.learningEvents.push({
        id: makeId("event"),
        userId: user.id,
        eventType: "quiz_submitted",
        metadata: {
          lessonId: lesson.id,
          conceptId: lesson.conceptId,
          score,
          insertedRemedialLessonId: insertedLesson?.id
        },
        createdAt: nowIso()
      });

      const dashboard = buildDashboard(store, user.id);
      return {
        score,
        graded,
        updatedMastery: {
          [lesson.conceptId]: mastery.masteryScore
        },
        recommendation: dashboard.recommendedNextStep,
        insertedLesson
      };
    });

    return ok(response);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not submit quiz.");
  }
}
