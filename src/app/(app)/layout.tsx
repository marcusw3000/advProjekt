import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getMinutesBalance } from "@/lib/minutes";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const minutesBalance = await getMinutesBalance(session.user.id);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell userEmail={session.user.email ?? ""} minutesBalance={minutesBalance} onSignOut={handleSignOut}>
      {children}
    </AppShell>
  );
}
