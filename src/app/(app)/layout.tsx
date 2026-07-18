import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getCredits } from "@/lib/credits";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const credits = await getCredits(session.user.id);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell userEmail={session.user.email ?? ""} credits={credits} onSignOut={handleSignOut}>
      {children}
    </AppShell>
  );
}
