import { getAuthenticatedUser } from "@/lib/auth";
import { readStore } from "@/lib/db/store";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const store = await readStore();
  const user = getAuthenticatedUser(store, request);
  if (!user) return fail("Not signed in.", 401);
  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subject: user.subject,
      needsOnboarding: !user.goal?.trim()
    }
  });
}
