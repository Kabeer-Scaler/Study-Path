import { ProgressDashboard } from "@/components/ProgressDashboard";
import { buildDashboard } from "@/lib/adaptive/recommendationEngine";
import { findAuthenticatedUser, SESSION_COOKIE } from "@/lib/auth";
import { readStore } from "@/lib/db/store";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const store = await readStore();
  const authUser = findAuthenticatedUser(store, (await cookies()).get(SESSION_COOKIE)?.value ?? "");
  if (!authUser) redirect("/login");
  if (authUser.id !== userId) redirect(`/dashboard/${authUser.id}`);
  const user = store.users.find((item) => item.id === userId);

  if (!user) {
    return (
      <main className="page-shell">
        <div className="panel p-6">User not found.</div>
      </main>
    );
  }

  return <ProgressDashboard user={user} dashboard={buildDashboard(store, userId)} />;
}
