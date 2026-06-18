import { getMasteryMap } from "@/lib/adaptive/assessmentEngine";
import { assertOwnsUser, getAuthenticatedUser } from "@/lib/auth";
import { mutateStore, nowIso } from "@/lib/db/store";
import { fail, ok, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type CompleteAssessmentInput = {
  sessionId?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<CompleteAssessmentInput>(request);
    if (!body.sessionId) return fail("Missing sessionId.");

    const response = await mutateStore((store) => {
      const session = store.assessmentSessions.find(
        (item) => item.id === body.sessionId
      );
      if (!session) throw new Error("Assessment session not found.");
      assertOwnsUser(getAuthenticatedUser(store, request), session.userId);
      session.status = "completed";
      session.completedAt = session.completedAt ?? nowIso();
      session.currentQuestionId = undefined;
      return {
        userId: session.userId,
        mastery: getMasteryMap(store, session.userId, session.subject)
      };
    });

    return ok(response);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not complete assessment.");
  }
}
