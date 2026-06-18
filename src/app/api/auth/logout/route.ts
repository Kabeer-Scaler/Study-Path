import { serializeClearSessionCookie } from "@/lib/auth";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = ok({ signedOut: true });
  response.headers.append("Set-Cookie", serializeClearSessionCookie());
  return response;
}
