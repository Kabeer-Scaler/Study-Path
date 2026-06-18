import {
  createAssessmentSession,
  publicQuestion
} from "@/lib/adaptive/assessmentEngine";
import { ensureSubjectDomain } from "@/lib/adaptive/subjectEngine";
import { assertOwnsUser, getAuthenticatedUser } from "@/lib/auth";
import { mutateStore } from "@/lib/db/store";
import { fail, ok, readJson, serviceUnavailable } from "@/lib/http";

export const dynamic = "force-dynamic";

type StartAssessmentInput = {
  userId?: string;
  subject?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<StartAssessmentInput>(request);
    if (!body.userId) return fail("Missing userId.");

    const result = await mutateStore(async (store) => {
      assertOwnsUser(getAuthenticatedUser(store, request), body.userId);
      const user = store.users.find((item) => item.id === body.userId);
      if (!user) throw new Error("User not found.");
      await ensureSubjectDomain(store, user.subject);
      const { session, firstQuestion } = createAssessmentSession(store, user);
      return { session, firstQuestion };
    });

    return ok({
      sessionId: result.session.id,
      firstQuestion: publicQuestion(result.firstQuestion)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start assessment.";
    if (
      /Azure|Groq|rate limit|timeout|high-quality factual assessment|requires an LLM provider/i.test(message)
    ) {
      return serviceUnavailable(message);
    }
    return fail(message);
  }
}
