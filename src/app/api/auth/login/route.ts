import {
  createSessionToken,
  normalizeEmail,
  serializeSessionCookie,
  verifyPassword
} from "@/lib/auth";
import { mutateStore } from "@/lib/db/store";
import { fail, ok, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type LoginInput = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<LoginInput>(request);
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";
    if (!email || !password) return fail("Email and password are required.");

    const user = await mutateStore((store) => {
      const found = store.users.find((item) => item.email === email);
      if (!found || !verifyPassword(password, found.passwordHash)) {
        throw new Error("Invalid email or password.");
      }
      found.sessionToken = createSessionToken();
      return found;
    });

    const response = ok({ userId: user.id, needsOnboarding: !user.goal?.trim() });
    response.headers.append("Set-Cookie", serializeSessionCookie(user.id, user.sessionToken ?? ""));
    return response;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not sign in.");
  }
}
