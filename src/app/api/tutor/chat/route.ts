import {
  classifyTutorResponse,
  generateTutorResponseWithProvider,
  safeTutorFallback
} from "@/lib/ai/AIService";
import { assertOwnsUser, getAuthenticatedUser, getLessonOwnerId } from "@/lib/auth";
import { makeId, mutateStore, nowIso } from "@/lib/db/store";
import { fail, ok, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type TutorChatInput = {
  userId?: string;
  lessonId?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<TutorChatInput>(request);
    if (!body.userId || !body.lessonId || !body.message?.trim()) {
      return fail("Missing tutor chat fields.");
    }

    const response = await mutateStore(async (store) => {
      const authUser = getAuthenticatedUser(store, request);
      assertOwnsUser(authUser, body.userId);
      assertOwnsUser(authUser, getLessonOwnerId(store, body.lessonId));
      const user = store.users.find((item) => item.id === body.userId);
      const lesson = store.lessons.find((item) => item.id === body.lessonId);
      if (!user || !lesson) throw new Error("User or lesson not found.");
      const concept = store.concepts.find((item) => item.id === lesson.conceptId);
      if (!concept) throw new Error("Concept not found.");

      const history = store.tutorMessages.filter(
        (item) => item.userId === user.id && item.lessonId === lesson.id
      );
      const userMessage = {
        id: makeId("msg"),
        userId: user.id,
        lessonId: lesson.id,
        role: "user" as const,
        message: body.message?.trim() ?? "",
        createdAt: nowIso()
      };
      store.tutorMessages.push(userMessage);

      const mastery =
        store.learnerMastery.find(
          (item) => item.userId === user.id && item.conceptId === lesson.conceptId
        )?.masteryScore ?? 0.3;
      const latestMisconception = store.masteryEvidence
        .filter(
          (item) =>
            item.userId === user.id &&
            item.conceptId === lesson.conceptId &&
            item.misconception
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.misconception;
      const tutor = await generateTutorResponseWithProvider({
        concept,
        lessonTitle: lesson.title,
        mastery,
        message: body.message ?? "",
        priorMessages: [...history, userMessage],
        misconception: latestMisconception,
        learningObjective: lesson.content.learningObjective,
        explanationExcerpt: lesson.content.explanation.slice(0, 400),
        practiceQuestion: lesson.content.practiceQuestion.question
      });
      const policy = classifyTutorResponse({
        ...tutor,
        message: body.message ?? "",
        priorMessages: [...history, userMessage],
        concept
      });
      const safeTutor = policy.valid ? tutor : safeTutorFallback();
      const assistantMessage = {
        id: makeId("msg"),
        userId: user.id,
        lessonId: lesson.id,
        role: "assistant" as const,
        message: safeTutor.reply,
        tutorStrategy: safeTutor.tutorStrategy,
        createdAt: nowIso()
      };
      store.tutorMessages.push(assistantMessage);

      return {
        reply: safeTutor.reply,
        tutorStrategy: safeTutor.tutorStrategy,
        policyViolations: policy.valid ? [] : policy.violations,
        messages: [...history, userMessage, assistantMessage]
      };
    });

    return ok(response);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not send tutor message.");
  }
}
