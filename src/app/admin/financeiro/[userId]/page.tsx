import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { TransactionFilters } from "@/components/admin/TransactionFilters";
import { TransactionsTable } from "@/components/admin/TransactionsTable";
import { parseTransactionSearchParams, fetchTransactionsPage } from "@/lib/financeiro";

export default async function AdminFinanceiroUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await params;
  const sp = await searchParams;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, minutesBalance: true, createdAt: true },
  });
  if (!user) notFound();

  const filters = parseTransactionSearchParams(sp, { forcedUserId: userId });

  const [byReason, transactionsPage] = await Promise.all([
    db.minutesTransaction.groupBy({ by: ["reason"], where: { userId }, _sum: { amount: true } }),
    fetchTransactionsPage(filters),
  ]);

  const totalGranted = byReason
    .filter((r) => (r._sum.amount ?? 0) > 0)
    .reduce((sum, r) => sum + (r._sum.amount ?? 0), 0);
  const totalDebited = byReason
    .filter((r) => (r._sum.amount ?? 0) < 0)
    .reduce((sum, r) => sum + Math.abs(r._sum.amount ?? 0), 0);

  const hasActiveFilters = Boolean(filters.reason || filters.from || filters.to);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <Link
        href="/admin/financeiro"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Voltar ao Financeiro
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{user.name ?? user.email}</h1>
        <p className="text-sm text-muted-foreground">
          {user.email} · cliente desde{" "}
          {user.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="gap-2 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Wallet className="size-3.5" />
            Saldo atual
          </div>
          <p className="font-heading text-3xl font-bold text-foreground">
            {user.minutesBalance.toLocaleString("pt-BR")} min
          </p>
        </Card>

        <Card className="gap-2 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <TrendingUp className="size-3.5" />
            Total concedido
          </div>
          <p className="font-heading text-3xl font-bold text-foreground">{totalGranted.toLocaleString("pt-BR")} min</p>
        </Card>

        <Card className="gap-2 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <TrendingDown className="size-3.5" />
            Total consumido
          </div>
          <p className="font-heading text-3xl font-bold text-foreground">{totalDebited.toLocaleString("pt-BR")} min</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Histórico de lançamentos</h2>
        <TransactionFilters
          basePath={`/admin/financeiro/${userId}`}
          showEmailFilter={false}
          defaultValues={{
            reason: filters.reason,
            from: sp.from as string | undefined,
            to: sp.to as string | undefined,
          }}
        />
        <TransactionsTable
          transactions={transactionsPage.transactions}
          showUserColumn={false}
          pagination={transactionsPage}
          basePath={`/admin/financeiro/${userId}`}
          currentSearchParams={sp}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
    </div>
  );
}
