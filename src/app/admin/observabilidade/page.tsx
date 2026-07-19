import Link from "next/link";
import { AlertCircle, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { getRecentSentryIssues } from "@/lib/sentryApi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsageChart } from "@/components/admin/UsageChart";

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

export default async function AdminObservabilityPage() {
  const [issues, signupRows, videoRows, minutesRows] = await Promise.all([
    getRecentSentryIssues(),
    db.$queryRaw<RawDayCount[]>`
      SELECT date_trunc('day', "createdAt") as day, count(*)::int as count
      FROM "User"
      WHERE "createdAt" >= now() - interval '30 days'
      GROUP BY day ORDER BY day
    `,
    db.$queryRaw<RawDayCount[]>`
      SELECT date_trunc('day', "createdAt") as day, count(*)::int as count
      FROM "Video"
      WHERE "createdAt" >= now() - interval '30 days'
      GROUP BY day ORDER BY day
    `,
    db.$queryRaw<RawDayCount[]>`
      SELECT date_trunc('day', "createdAt") as day, sum(abs(amount))::int as count
      FROM "MinutesTransaction"
      WHERE reason = 'VIDEO_TRANSCRIPTION' AND "createdAt" >= now() - interval '30 days'
      GROUP BY day ORDER BY day
    `,
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Observabilidade</h1>
        <p className="text-sm text-muted-foreground">Erros e uso do sistema ao longo do tempo.</p>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Erros (Sentry)</h2>
        {issues === null ? (
          <Card className="items-center gap-3 px-6 py-10 text-center">
            <AlertCircle className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Sentry não configurado</p>
              <p className="text-sm text-muted-foreground">
                Preencha <code>SENTRY_AUTH_TOKEN</code>, <code>SENTRY_ORG</code> e{" "}
                <code>SENTRY_PROJECT</code> no <code>.env</code> (veja <code>todo.md</code>).
              </p>
            </div>
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Criar conta no Sentry <ExternalLink className="size-3.5" />
            </a>
          </Card>
        ) : issues.length === 0 ? (
          <Card className="items-center gap-2 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhum erro não-resolvido nos últimos 14 dias.</p>
          </Card>
        ) : (
          <Card className="gap-0 overflow-hidden p-0">
            {issues.map((issue) => (
              <a
                key={issue.id}
                href={issue.permalink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-secondary/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{issue.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{issue.culprit}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="border-transparent bg-destructive/15 text-destructive">
                    {issue.level}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{issue.count}x</span>
                </div>
              </a>
            ))}
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
          Uso (últimos {DAYS} dias)
        </h2>
        <Card className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
          <UsageChart title="Cadastros/dia" data={fillDays(signupRows)} color={1} unit="cadastros" />
          <UsageChart title="Vídeos/dia" data={fillDays(videoRows)} color={2} unit="vídeos" />
          <UsageChart title="Minutos consumidos/dia" data={fillDays(minutesRows)} color={3} unit="min" />
        </Card>
      </div>
    </div>
  );
}
