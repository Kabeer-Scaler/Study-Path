import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { DataStore, User } from "@/lib/types";

export const SESSION_COOKIE = "learnpath_session";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const attempted = Buffer.from(scryptSync(password, salt, 64).toString("hex"));
  const expected = Buffer.from(hash);
  return attempted.length === expected.length && timingSafeEqual(attempted, expected);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function serializeSessionCookie(userId: string, token: string) {
  const value = `${userId}.${token}`;
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 14}`;
}

export function serializeClearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getSessionCookieValue(cookieHeader: string | null) {
  return (
    cookieHeader
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1) ?? ""
  );
}

export function findAuthenticatedUser(store: DataStore, cookieValue: string) {
  const [userId, token] = cookieValue.split(".");
  if (!userId || !token) return undefined;
  return store.users.find(
    (user) => user.id === userId && user.sessionToken && user.sessionToken === token
  );
}

export function getAuthenticatedUser(store: DataStore, request: Request) {
  return findAuthenticatedUser(
    store,
    getSessionCookieValue(request.headers.get("cookie"))
  );
}

export function getLessonOwnerId(store: DataStore, lessonId?: string) {
  const lesson = store.lessons.find((item) => item.id === lessonId);
  const module = lesson ? store.modules.find((item) => item.id === lesson.moduleId) : undefined;
  const curriculum = module
    ? store.curricula.find((item) => item.id === module.curriculumId)
    : undefined;
  return curriculum?.userId;
}

export function assertOwnsUser(authUser: User | undefined, userId?: string) {
  if (!authUser) throw new Error("Please sign in first.");
  if (!userId || authUser.id !== userId) {
    throw new Error("You are not authorized to access this learner.");
  }
}
