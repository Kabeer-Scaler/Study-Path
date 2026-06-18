import {
  getMasteryMap,
  getQuestionById,
  publicQuestion
} from "@/lib/adaptive/assessmentEngine";
import { assertOwnsUser, getAuthenticatedUser } from "@/lib/auth";
import { readStore } from "@/lib/db/store";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const store = await readStore();
  const session = store.assessmentSessions.find((item) => item.id === sessionId);
  if (!session) return fail("Assessment session not found.", 404);
  try {
    assertOwnsUser(getAuthenticatedUser(store, request), session.userId);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unauthorized.", 401);
  }

  const question = getQuestionById(store, session.currentQuestionId);
  const answers = store.assessmentAnswers.filter(
    (item) => item.sessionId === session.id
  );

  return ok({
    sessionId: session.id,
    userId: session.userId,
    status: session.status,
    currentQuestion: question ? publicQuestion(question) : undefined,
    answeredCount: answers.length,
    targetQuestionCount: 10,
    maxQuestionCount: 14,
    isComplete: session.status === "completed",
    mastery: getMasteryMap(store, session.userId, session.subject)
  });
}
