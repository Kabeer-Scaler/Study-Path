import { hashPassword, normalizeEmail } from "@/lib/auth";
import { DEFAULT_SUBJECT } from "@/lib/db/seed";
import { makeId, mutateStore, nowIso } from "@/lib/db/store";
import { fail, ok, readJson } from "@/lib/http";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

type RegisterInput = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<RegisterInput>(request);
    const name = body.name?.trim();
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";

    if (!name || !email || !password) {
      return fail("Name, email, and password are required.");
    }
    if (password.length < 8) {
      return fail("Password must be at least 8 characters.");
    }

    const user = await mutateStore((store) => {
      if (store.users.some((item) => item.email === email)) {
        throw new Error("An account with this email already exists.");
      }
      const createdUser: User = {
        id: makeId("user"),
        email,
        passwordHash: hashPassword(password),
        name,
        subject: DEFAULT_SUBJECT,
        goal: "",
        selfRatedLevel: "Beginner",
        preferredStyle: "Examples and practice",
        dailyTimeMinutes: 30,
        createdAt: nowIso()
      };
      store.users.push(createdUser);
      return createdUser;
    });

    return ok({ userId: user.id }, 201);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not register.");
  }
}
