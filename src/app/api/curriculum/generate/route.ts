import { ensureMasteryRecords } from "@/lib/adaptive/assessmentEngine";
import {
  generateCurriculumForUser,
  getCurriculumBundle
} from "@/lib/adaptive/curriculumEngine";
import { generateLessonWithProvider } from "@/lib/ai/AIService";
import { assertOwnsUser, getAuthenticatedUser } from "@/lib/auth";
import { mutateStore } from "@/lib/db/store";
import { fail, ok, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type GenerateCurriculumInput = {
  userId?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<GenerateCurriculumInput>(request);
    if (!body.userId) return fail("Missing userId.");

    const result = await mutateStore(async (store) => {
      assertOwnsUser(getAuthenticatedUser(store, request), body.userId);
      const user = store.users.find((item) => item.id === body.userId);
      if (!user) throw new Error("User not found.");
      ensureMasteryRecords(store, user);
      const curriculum = generateCurriculumForUser(store, user);
      const bundle = getCurriculumBundle(store, user.id);
      for (const lesson of bundle?.modules.flatMap((module) => module.lessons) ?? []) {
        if (lesson.status === "skipped") continue;
        const concept = store.concepts.find((item) => item.id === lesson.conceptId);
        const mastery =
          store.learnerMastery.find(
            (item) => item.userId === user.id && item.conceptId === lesson.conceptId
          )?.masteryScore ?? 0.35;
        if (concept) {
          lesson.content = await generateLessonWithProvider(
            concept,
            mastery,
            user.preferredStyle,
            lesson.isRemedial
              ? { mode: "remedial" }
              : lesson.isChallenge
                ? { mode: "challenge" }
                : { mode: "core" }
          );
        }
      }
      return { curriculum, modules: bundle?.modules ?? [] };
    });

    return ok({
      curriculumId: result.curriculum.id,
      curriculum: result.curriculum,
      modules: result.modules
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not generate curriculum.");
  }
}
