import { db } from "@/lib/db";
import { UsersTable } from "@/components/admin/UsersTable";

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      minutesBalance: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { videos: true } },
    },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-sm text-muted-foreground">{users.length} usuários cadastrados.</p>
      </div>

      <UsersTable
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          minutesBalance: u.minutesBalance,
          isAdmin: u.isAdmin,
          createdAt: u.createdAt.toISOString(),
          videoCount: u._count.videos,
        }))}
      />
    </div>
  );
}
