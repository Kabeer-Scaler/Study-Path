import { ensureMasteryRecords, pruneMasteryOutsideSubject } from "@/lib/adaptive/assessmentEngine";
import { ensureSubjectDomain } from "@/lib/adaptive/subjectEngine";
import { getAuthenticatedUser } from "@/lib/auth";
import { DEFAULT_SUBJECT } from "@/lib/db/seed";
import { makeId, mutateStore, nowIso } from "@/lib/db/store";
import { fail, ok, readJson, serviceUnavailable } from "@/lib/http";

export const dynamic = "force-dynamic";

type CreateUserInput = {
  name?: string;
  subject?: string;
  goal?: string;
  selfRatedLevel?: string;
  preferredStyle?: string;
  dailyTimeMinutes?: number;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<CreateUserInput>(request);
    const subject = body.subject?.trim() || DEFAULT_SUBJECT;
    const goal = body.goal?.trim();
    const selfRatedLevel = body.selfRatedLevel?.trim();
    const preferredStyle = body.preferredStyle?.trim();
    const dailyTimeMinutes = Number(body.dailyTimeMinutes);

    if (!goal || !selfRatedLevel || !preferredStyle) {
      return fail("Please complete all learning profile fields.");
    }
    if (!Number.isFinite(dailyTimeMinutes) || dailyTimeMinutes < 10) {
      return fail("Daily available time should be at least 10 minutes.");
    }

    const user = await mutateStore(async (store) => {
      const authUser = getAuthenticatedUser(store, request);
      if (!authUser) throw new Error("Please sign in before creating a learning profile.");
      authUser.subject = subject;
      authUser.goal = goal;
      authUser.selfRatedLevel = selfRatedLevel;
      authUser.preferredStyle = preferredStyle;
      authUser.dailyTimeMinutes = dailyTimeMinutes;
      const profileUser = {
        ...authUser,
        subject,
        goal,
        selfRatedLevel,
        preferredStyle,
        dailyTimeMinutes
      };
      await ensureSubjectDomain(store, profileUser.subject);
      pruneMasteryOutsideSubject(store, profileUser.id, profileUser.subject);
      ensureMasteryRecords(store, profileUser);
      store.learningEvents.push({
        id: makeId("event"),
        userId: profileUser.id,
        eventType: "learning_profile_updated",
        metadata: { subject, selfRatedLevel, preferredStyle },
        createdAt: nowIso()
      });
      return profileUser;
    });

    const response = ok({
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subject: user.subject,
        goal: user.goal,
        selfRatedLevel: user.selfRatedLevel,
        preferredStyle: user.preferredStyle,
        dailyTimeMinutes: user.dailyTimeMinutes,
        createdAt: user.createdAt
      }
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create user.";
    if (
      /Azure|Groq|rate limit|timeout|high-quality factual assessment|requires an LLM provider/i.test(message)
    ) {
      return serviceUnavailable(message);
    }
    return fail(message);
  }
}
