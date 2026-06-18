import {
  chooseNextQuestion,
  getMasteryMap,
  getMasteryRecord,
  getQuestionById,
  publicQuestion
} from "@/lib/adaptive/assessmentEngine";
import { recordMasteryEvidence } from "@/lib/adaptive/evidenceEngine";
import {
  applyAssessmentAntiGamingCap,
  updateAssessmentConfidence,
  updateAssessmentMastery
} from "@/lib/adaptive/masteryEngine";
import { evaluateAnswer } from "@/lib/ai/AIService";
import { assertOwnsUser, getAuthenticatedUser } from "@/lib/auth";
import { makeId, mutateStore, nowIso } from "@/lib/db/store";
import { fail, ok, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type SubmitAssessmentAnswerInput = {
  sessionId?: string;
  questionId?: string;
  answer?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<SubmitAssessmentAnswerInput>(request);
    if (!body.sessionId || !body.questionId) {
      return fail("Missing sessionId or questionId.");
    }
    if (!body.answer?.trim()) {
      return fail("Please select or enter an answer before continuing.");
    }

    const response = await mutateStore((store) => {
      const session = store.assessmentSessions.find(
        (item) => item.id === body.sessionId
      );
      if (!session) throw new Error("Assessment session not found.");
      assertOwnsUser(getAuthenticatedUser(store, request), session.userId);
      if (session.status === "completed") {
        return {
          isCorrect: false,
          explanation: "Assessment is already complete.",
          isComplete: true,
          userId: session.userId,
          mastery: getMasteryMap(store, session.userId, session.subject)
        };
      }

      const question = getQuestionById(store, body.questionId);
      if (!question) throw new Error("Assessment question not found.");
      if (session.currentQuestionId !== question.id) {
        throw new Error("This question is no longer active.");
      }

      const evaluation = evaluateAnswer(question, body.answer ?? "");
      const mastery = getMasteryRecord(store, session.userId, question.conceptId);
      const previousConceptAnswers = store.assessmentAnswers.filter(
        (answer) =>
          answer.sessionId === session.id && answer.conceptId === question.conceptId
      );
      const previousMastery = mastery.masteryScore;
      const previousConfidence = mastery.confidence;
      const nextConfidence = updateAssessmentConfidence({
        currentConfidence: mastery.confidence,
        isCorrect: evaluation.isCorrect,
        previousConceptAnswers
      });
      const proposedMastery = updateAssessmentMastery(
        mastery.masteryScore,
        evaluation.isCorrect,
        question.difficulty
      );
      mastery.masteryScore = applyAssessmentAntiGamingCap({
        proposedMastery,
        evidenceCount: previousConceptAnswers.length + 1,
        confidence: nextConfidence
      });
      mastery.confidence = nextConfidence;
      mastery.updatedAt = nowIso();

      const answerId = makeId("answer");
      store.assessmentAnswers.push({
        id: answerId,
        sessionId: session.id,
        conceptId: question.conceptId,
        questionId: question.id,
        question: question.question,
        userAnswer: body.answer ?? "",
        correctAnswer: question.correctAnswer,
        isCorrect: evaluation.isCorrect,
        explanation: question.explanation,
        misconception: evaluation.misconception || undefined,
        difficulty: question.difficulty,
        createdAt: nowIso()
      });

      recordMasteryEvidence(store, {
        userId: session.userId,
        conceptId: question.conceptId,
        previousMastery,
        newMastery: mastery.masteryScore,
        previousConfidence,
        newConfidence: mastery.confidence,
        reason: `${evaluation.isCorrect ? "Correct" : "Incorrect"} assessment answer on a difficulty ${question.difficulty} question.`,
        source: "assessment_answer",
        sourceId: answerId,
        misconception: evaluation.misconception || undefined
      });

      const nextQuestion = chooseNextQuestion(store, session);
      if (nextQuestion) {
        session.currentQuestionId = nextQuestion.id;
        session.askedQuestionIds.push(nextQuestion.id);
      }
      const isComplete = !nextQuestion;

      store.learningEvents.push({
        id: makeId("event"),
        userId: session.userId,
        eventType: "assessment_answered",
        metadata: {
          conceptId: question.conceptId,
          isCorrect: evaluation.isCorrect,
          mastery: mastery.masteryScore
        },
        createdAt: nowIso()
      });

      return {
        isCorrect: evaluation.isCorrect,
        explanation: question.explanation,
        feedback: evaluation.feedback,
        nextQuestion: nextQuestion ? publicQuestion(nextQuestion) : undefined,
        isComplete,
        userId: session.userId,
        answeredCount: store.assessmentAnswers.filter(
          (answer) => answer.sessionId === session.id
        ).length,
        mastery: getMasteryMap(store, session.userId, session.subject)
      };
    });

    return ok(response);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not submit answer.");
  }
}
