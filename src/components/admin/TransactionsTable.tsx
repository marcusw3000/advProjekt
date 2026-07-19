import Link from "next/link";
import type { TransactionRow } from "@/lib/financeiro";
import { Card } from "@/components/ui/card";

const REASON_LABELS: Record<string, string> = {
  SIGNUP_GRANT: "Bônus de cadastro",
  VIDEO_TRANSCRIPTION: "Transcrição de vídeo",
  PURCHASE: "Compra",
  ADMIN_ADJUSTMENT: "Ajuste manual",
};

type SearchParams = Record<string, string | string[] | undefined>;

function buildPageHref(basePath: string, currentSearchParams: SearchParams, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(currentSearchParams)) {
    if (key === "page") continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function TransactionsTable({
  transactions,
  showUserColumn,
  pagination,
  basePath,
  currentSearchParams,
  hasActiveFilters,
}: {
  transactions: TransactionRow[];
  showUserColumn: boolean;
  pagination: { page: number; pageCount: number; total: number; pageSize: number };
  basePath: string;
  currentSearchParams: SearchParams;
  hasActiveFilters: boolean;
}) {
  const gridCols = showUserColumn
    ? "grid-cols-[minmax(0,1fr)_150px_112px_100px]"
    : "grid-cols-[minmax(0,1fr)_112px_100px]";

  if (transactions.length === 0) {
    return (
      <Card className="items-center gap-2 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {hasActiveFilters ? "Nenhum lançamento encontrado para esses filtros." : "Nenhum lançamento ainda."}
        </p>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div
        className={`grid ${gridCols} items-center gap-4 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground`}
      >
        {showUserColumn && <span>Usuário</span>}
        <span>Motivo</span>
        <span>Data</span>
        <span className="text-right">Valor</span>
      </div>

      {transactions.map((t) => (
        <div
          key={t.id}
          className={`grid ${gridCols} items-center gap-4 border-b border-border px-4 py-3 text-sm last:border-0`}
        >
          {showUserColumn && (
            <Link
              href={`/admin/financeiro/${t.userId}`}
              className="truncate text-foreground hover:text-primary hover:underline"
            >
              {t.userEmail}
            </Link>
          )}
          <span className="text-muted-foreground">{REASON_LABELS[t.reason] ?? t.reason}</span>
          <span className="text-muted-foreground">
            {t.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <span className={`text-right font-mono ${t.amount < 0 ? "text-destructive" : "text-foreground"}`}>
            {t.amount > 0 ? "+" : ""}
            {t.amount} min
          </span>
        </div>
      ))}

      <div className="flex items-center justify-between gap-4 px-4 py-3 text-xs text-muted-foreground">
        <span>
          {pagination.total} lançamento{pagination.total === 1 ? "" : "s"} · página {pagination.page} de{" "}
          {pagination.pageCount}
        </span>
        <div className="flex items-center gap-3">
          {pagination.page > 1 ? (
            <Link
              href={buildPageHref(basePath, currentSearchParams, pagination.page - 1)}
              className="font-medium text-foreground hover:underline"
            >
              ← Anterior
            </Link>
          ) : (
            <span className="opacity-40">← Anterior</span>
          )}
          {pagination.page < pagination.pageCount ? (
            <Link
              href={buildPageHref(basePath, currentSearchParams, pagination.page + 1)}
              className="font-medium text-foreground hover:underline"
            >
              Próxima →
            </Link>
          ) : (
            <span className="opacity-40">Próxima →</span>
          )}
        </div>
      </div>
    </Card>
  );
}
