import type { Prisma } from "@/generated/prisma/client";
import { MinutesReason } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const DEFAULT_PAGE_SIZE = 25;
const MIN_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const MAX_EMAIL_QUERY_LENGTH = 100;

const REASON_VALUES: string[] = Object.values(MinutesReason);

export type TransactionFilters = {
  userId?: string;
  emailQuery?: string;
  reason?: MinutesReason;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp);
}

export function parseTransactionSearchParams(
  sp: SearchParams,
  opts?: { forcedUserId?: string }
): TransactionFilters {
  const pageRaw = Number(first(sp.page));
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const pageSizeRaw = Number(first(sp.pageSize));
  const pageSize =
    Number.isInteger(pageSizeRaw) && pageSizeRaw >= MIN_PAGE_SIZE && pageSizeRaw <= MAX_PAGE_SIZE
      ? pageSizeRaw
      : DEFAULT_PAGE_SIZE;

  const reasonRaw = first(sp.reason);
  const reason = reasonRaw && REASON_VALUES.includes(reasonRaw) ? (reasonRaw as MinutesReason) : undefined;

  let from = parseDate(first(sp.from));
  let to = parseDate(first(sp.to));
  if (to) to = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
  if (from && to && from > to) {
    from = undefined;
    to = undefined;
  }

  const emailQueryRaw = first(sp.email)?.trim();
  const emailQuery = emailQueryRaw ? emailQueryRaw.slice(0, MAX_EMAIL_QUERY_LENGTH) : undefined;

  return {
    userId: opts?.forcedUserId,
    emailQuery,
    reason,
    from,
    to,
    page,
    pageSize,
  };
}

export function buildTransactionWhere(f: TransactionFilters): Prisma.MinutesTransactionWhereInput {
  return {
    ...(f.userId ? { userId: f.userId } : {}),
    ...(f.reason ? { reason: f.reason } : {}),
    ...(f.emailQuery ? { user: { email: { contains: f.emailQuery, mode: "insensitive" as const } } } : {}),
    ...(f.from || f.to
      ? { createdAt: { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) } }
      : {}),
  };
}

export type TransactionRow = {
  id: string;
  amount: number;
  amountCents: number | null;
  currency: string | null;
  reason: MinutesReason;
  createdAt: Date;
  userId: string;
  userEmail: string;
};

export async function fetchTransactionsPage(f: TransactionFilters): Promise<{
  transactions: TransactionRow[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}> {
  const where = buildTransactionWhere(f);
  const total = await db.minutesTransaction.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / f.pageSize));
  const page = Math.min(f.page, pageCount);

  const rows = await db.minutesTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * f.pageSize,
    take: f.pageSize,
    include: { user: { select: { email: true } } },
  });

  return {
    transactions: rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      amountCents: r.amountCents,
      currency: r.currency,
      reason: r.reason,
      createdAt: r.createdAt,
      userId: r.userId,
      userEmail: r.user.email,
    })),
    total,
    page,
    pageCount,
    pageSize: f.pageSize,
  };
}
