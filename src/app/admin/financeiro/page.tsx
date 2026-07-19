import { Coins, DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { UsageChart } from "@/components/admin/UsageChart";
import { TransactionFilters } from "@/components/admin/TransactionFilters";
import { TransactionsTable } from "@/components/admin/TransactionsTable";
import { parseTransactionSearchParams, fetchTransactionsPage } from "@/lib/financeiro";

const REASON_LABELS: Record<string, string> = {
  SIGNUP_GRANT: "Bônus de cadastro",
  VIDEO_TRANSCRIPTION: "Transcrição de vídeo",
  PURCHASE: "Compra",
  ADMIN_ADJUSTMENT: "Ajuste manual",
};

const DAYS = 30;

type RawDayCount = { day: Date; count: bigint | number };

function fillDays(rows: RawDayCount[]) {
  const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]));
  const result: { day: string; count: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ day: key, count: byDay.get(key) ?? 0 });
  }
  return result;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function AdminFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseTransactionSearchParams(sp);

  const [balanceTotal, byReason, revenue, transactionsPage, grantedRows, debitedRows] = await Promise.all([
    db.user.aggregate({ _sum: { minutesBalance: true } }),
    db.minutesTransaction.groupBy({ by: ["reason"], _sum: { amount: true }, _count: true }),
    db.minutesTransaction.aggregate({
      where: { amountCents: { not: null } },
      _sum: { amountCents: true },
      _count: true,
    }),
    fetchTransactionsPage(filters),
    db.$queryRaw<RawDayCount[]>`
      SELECT date_trunc('day', "createdAt") as day, sum(amount)::int as count
      FROM "MinutesTransaction"
      WHERE amount > 0 AND "createdAt" >= now() - interval '30 days'
      GROUP BY day ORDER BY day
    `,
    db.$queryRaw<RawDayCount[]>`
      SELECT date_trunc('day', "createdAt") as day, sum(abs(amount))::int as count
      FROM "MinutesTransaction"
      WHERE amount < 0 AND "createdAt" >= now() - interval '30 days'
      GROUP BY day ORDER BY day
    `,
  ]);

  const totalGranted = byReason
    .filter((r) => (r._sum.amount ?? 0) > 0)
    .reduce((sum, r) => sum + (r._sum.amount ?? 0), 0);
  const totalDebited = byReason
    .filter((r) => (r._sum.amount ?? 0) < 0)
    .reduce((sum, r) => sum + Math.abs(r._sum.amount ?? 0), 0);

  const hasActiveFilters = Boolean(filters.emailQuery || filters.reason || filters.from || filters.to);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Ledger de minutos/créditos. Não há gateway de pagamento integrado ainda — os valores em minutos refletem o
          saldo de créditos, não receita monetária real.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="gap-2 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Wallet className="size-3.5" />
            Saldo em circulação
          </div>
          <p className="font-heading text-3xl font-bold text-foreground">
            {(balanceTotal._sum.minutesBalance ?? 0).toLocaleString("pt-BR")} min
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

        <Card className="gap-2 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <DollarSign className="size-3.5" />
            Receita
          </div>
          {revenue._count === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados — pagamento não integrado ainda</p>
          ) : (
            <p className="font-heading text-3xl font-bold text-foreground">
              {currencyFormatter.format((revenue._sum.amountCents ?? 0) / 100)}
            </p>
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
          <Coins className="size-4" />
          Por motivo
        </h2>
        <Card className="gap-0 overflow-hidden p-0">
          <div className="grid grid-cols-[minmax(0,1fr)_100px_120px] items-center gap-4 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Motivo</span>
            <span className="text-right">Lançamentos</span>
            <span className="text-right">Total</span>
          </div>
          {byReason.map((r) => (
            <div
              key={r.reason}
              className="grid grid-cols-[minmax(0,1fr)_100px_120px] items-center gap-4 border-b border-border px-4 py-3 text-sm last:border-0"
            >
              <span className="text-foreground">{REASON_LABELS[r.reason] ?? r.reason}</span>
              <span className="text-right font-mono text-muted-foreground">{r._count}</span>
              <span
                className={`text-right font-mono ${(r._sum.amount ?? 0) < 0 ? "text-destructive" : "text-foreground"}`}
              >
                {(r._sum.amount ?? 0) > 0 ? "+" : ""}
                {(r._sum.amount ?? 0).toLocaleString("pt-BR")} min
              </span>
            </div>
          ))}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
          Movimentação (últimos {DAYS} dias)
        </h2>
        <Card className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <UsageChart title="Concedido/dia" data={fillDays(grantedRows)} color={1} unit="min" />
          <UsageChart title="Consumido/dia" data={fillDays(debitedRows)} color={3} unit="min" />
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Lançamentos</h2>
        <TransactionFilters
          basePath="/admin/financeiro"
          defaultValues={{
            email: filters.emailQuery,
            reason: filters.reason,
            from: sp.from as string | undefined,
            to: sp.to as string | undefined,
          }}
        />
        <TransactionsTable
          transactions={transactionsPage.transactions}
          showUserColumn
          pagination={transactionsPage}
          basePath="/admin/financeiro"
          currentSearchParams={sp}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
    </div>
  );
}
