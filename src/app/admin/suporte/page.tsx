import { db } from "@/lib/db";
import { SupportTicketsTable } from "@/components/admin/SupportTicketsTable";

export default async function AdminSupportPage() {
  const tickets = await db.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { email: true } } },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Suporte</h1>
        <p className="text-sm text-muted-foreground">{tickets.length} tickets recentes.</p>
      </div>

      <SupportTicketsTable
        tickets={tickets.map((t) => ({
          id: t.id,
          subject: t.subject,
          message: t.message,
          status: t.status,
          createdAt: t.createdAt.toISOString(),
          userEmail: t.user.email,
        }))}
      />
    </div>
  );
}
