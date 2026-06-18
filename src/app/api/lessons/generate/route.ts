import { getCurriculumBundle } from "@/lib/adaptive/curriculumEngine";
import { generateLessonWithProvider } from "@/lib/ai/AIService";
import { assertOwnsUser, getAuthenticatedUser } from "@/lib/auth";
import { makeId, mutateStore } from "@/lib/db/store";
import { fail, ok, readJson } from "@/lib/http";
import type { Lesson, Module } from "@/lib/types";

export const dynamic = "force-dynamic";

type GenerateLessonInput = {
  userId?: string;
  conceptId?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<GenerateLessonInput>(request);
    if (!body.userId || !body.conceptId) {
      return fail("Missing userId or conceptId.");
    }

    const result = await mutateStore(async (store) => {
      assertOwnsUser(getAuthenticatedUser(store, request), body.userId);
      const user = store.users.find((item) => item.id === body.userId);
      const concept = store.concepts.find((item) => item.id === body.conceptId);
      if (!user || !concept) throw new Error("User or concept not found.");

      const existing = store.lessons.find((lesson) => {
        const module = store.modules.find((item) => item.id === lesson.moduleId);
        const curriculum = module
          ? store.curricula.find((item) => item.id === module.curriculumId)
          : undefined;
        return curriculum?.userId === user.id && lesson.conceptId === concept.id;
      });
      if (existing) return existing;

      let curriculum = store.curricula.find((item) => item.userId === user.id);
      if (!curriculum) {
        curriculum = {
          id: makeId("curr"),
          userId: user.id,
          subject: user.subject,
          title: `${user.name}'s Generated Lessons`,
          generatedReason: "Created from an on-demand lesson request.",
          version: 1,
          changeReason: "Created from an on-demand lesson request.",
          isLatest: true,
          createdAt: new Date().toISOString()
        };
        store.curricula.push(curriculum);
      }

      const module: Module = {
        id: makeId("mod"),
        curriculumId: curriculum.id,
        title: `Focus: ${concept.name}`,
        description: "Generated on demand.",
        reason: `Generated because ${concept.name.toLowerCase()} was requested directly.`,
        orderIndex: store.modules.filter((item) => item.curriculumId === curriculum.id)
          .length,
        targetConcepts: [concept.id]
      };
      store.modules.push(module);

      const mastery =
        store.learnerMastery.find(
          (item) => item.userId === user.id && item.conceptId === concept.id
        )?.masteryScore ?? 0.35;
      const lesson: Lesson = {
        id: makeId("lesson"),
        moduleId: module.id,
        conceptId: concept.id,
        title: `${concept.name} in Practice`,
        content: await generateLessonWithProvider(
          concept,
          mastery,
          user.preferredStyle
        ),
        estimatedMinutes: 20,
        orderIndex: store.lessons.length,
        status: "not_started",
        masteryTarget: 0.8,
        whyAssigned: module.reason
      };
      store.lessons.push(lesson);
      return lesson;
    });

    return ok({ lessonId: result.id, lesson: result });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not generate lesson.");
  }
}
