import { getCurriculumBundle } from "@/lib/adaptive/curriculumEngine";
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

  const bundle = getCurriculumBundle(store, userId);
  if (!bundle) {
    return fail("Please complete the assessment first.", 404);
  }

  return ok({
    user: { id: user.id, email: user.email, name: user.name, subject: user.subject },
    ...bundle
  });
}
