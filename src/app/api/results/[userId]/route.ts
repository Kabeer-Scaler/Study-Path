import { getMasteryRecordsForSubject } from "@/lib/adaptive/assessmentEngine";
import { assertOwnsUser, getAuthenticatedUser } from "@/lib/auth";
import { readStore } from "@/lib/db/store";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const store = await readStore();
  try {
    assertOwnsUser(getAuthenticatedUser(store, request), userId);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
  const user = store.users.find((item) => item.id === userId);
  if (!user) return fail("User not found.", 404);

  const masteryRecords = getMasteryRecordsForSubject(store, userId, user.subject);
  const mastery = Object.fromEntries(
    masteryRecords.map((item) => [item.conceptId, item.masteryScore])
  );
  const named = masteryRecords.map((record) => ({
    ...record,
    conceptName:
      store.concepts.find((concept) => concept.id === record.conceptId)?.name ??
      record.conceptId
  }));
  const weakAreas = named
    .filter((item) => item.masteryScore < 0.6)
    .sort((a, b) => a.masteryScore - b.masteryScore);
  const strengths = named
    .filter((item) => item.masteryScore >= 0.75)
    .sort((a, b) => b.masteryScore - a.masteryScore);
  const latestSession = store.assessmentSessions
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

  return ok({
    user: { id: user.id, email: user.email, name: user.name, subject: user.subject },
    mastery,
    weakAreas,
    strengths,
    latestSession,
    answersCount: latestSession
      ? store.assessmentAnswers.filter(
          (answer) => answer.sessionId === latestSession.id
        ).length
      : 0
  });
}
