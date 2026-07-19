import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";

const STUCK_JOB_TIMEOUT_MS = 15 * 60 * 1000;

export default async function AdminJobsPage() {
  const [totalJobs, failedCount, stuckJobs, failedJobs, cronRuns] = await Promise.all([
    db.transcriptionJob.count(),
    db.transcriptionJob.count({ where: { status: "FAILED" } }),
    db.transcriptionJob.findMany({
      where: {
        status: { in: ["DOWNLOADING", "PROCESSING"] },
        updatedAt: { lt: new Date(Date.now() - STUCK_JOB_TIMEOUT_MS) },
      },
      include: { video: true },
    }),
    db.transcriptionJob.findMany({
      where: { status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      take: 15,
      include: { video: true },
    }),
    db.cronRun.findMany({ orderBy: { startedAt: "desc" }, take: 15 }),
  ]);

  const failureRate = totalJobs > 0 ? ((failedCount / totalJobs) * 100).toFixed(1) : "0.0";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Jobs</h1>
        <p className="text-sm text-muted-foreground">Saúde do pipeline de transcrição.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="gap-2 p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Taxa de falha
          </div>
          <p className="font-heading text-3xl font-bold text-foreground">{failureRate}%</p>
          <p className="text-xs text-muted-foreground">{failedCount} de {totalJobs} jobs</p>
        </Card>

        <Card className="gap-2 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Clock className="size-3.5" />
            Travados agora
          </div>
          <p className="font-heading text-3xl font-bold text-foreground">{stuckJobs.length}</p>
          <p className="text-xs text-muted-foreground">Sem atualização há mais de 15 min</p>
        </Card>

        <Card className="gap-2 p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Última execução do cron
          </div>
          <p className="font-heading text-lg font-bold text-foreground">
            {cronRuns[0]
              ? cronRuns[0].startedAt.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
              : "Nunca rodou"}
          </p>
          {cronRuns[0]?.error && <p className="text-xs text-destructive">Erro na última execução</p>}
        </Card>
      </div>

      {stuckJobs.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <AlertTriangle className="size-4 text-destructive" />
            Jobs travados
          </h2>
          <Card className="gap-0 overflow-hidden p-0">
            {stuckJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm last:border-0">
                <Link href={`/videos/${job.videoId}`} className="truncate font-medium text-foreground hover:underline">
                  {job.video.title}
                </Link>
                <span className="text-muted-foreground">
                  desde {job.updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
          Histórico de execuções do cron
        </h2>
        {cronRuns.length === 0 ? (
          <Card className="items-center gap-2 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Cron ainda não rodou.</p>
          </Card>
        ) : (
          <Card className="gap-0 overflow-hidden p-0">
            <div className="grid grid-cols-[130px_88px_88px_88px_minmax(0,1fr)] items-center gap-4 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Quando</span>
              <span>Reconc.</span>
              <span>Process.</span>
              <span>Timeout</span>
              <span>Erro</span>
            </div>
            {cronRuns.map((run) => (
              <div
                key={run.id}
                className="grid grid-cols-[130px_88px_88px_88px_minmax(0,1fr)] items-center gap-4 border-b border-border px-4 py-3 text-sm last:border-0"
              >
                <span className="text-muted-foreground">
                  {run.startedAt.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="font-mono">{run.reconciled}</span>
                <span className="font-mono">{run.processed}</span>
                <span className="font-mono">{run.timedOut}</span>
                <span className="truncate text-destructive">{run.error ?? "—"}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
          Últimos jobs falhados
        </h2>
        {failedJobs.length === 0 ? (
          <Card className="items-center gap-2 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhum job falhado.</p>
          </Card>
        ) : (
          <Card className="gap-0 overflow-hidden p-0">
            <div className="grid grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)] items-center gap-4 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Vídeo</span>
              <span>Data</span>
              <span>Erro</span>
            </div>
            {failedJobs.map((job) => (
              <div
                key={job.id}
                className="grid grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)] items-center gap-4 border-b border-border px-4 py-3 text-sm last:border-0"
              >
                <Link href={`/videos/${job.videoId}`} className="truncate font-medium text-foreground hover:underline">
                  {job.video.title}
                </Link>
                <span className="text-muted-foreground">
                  {job.updatedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <span className="truncate text-destructive">{job.errorMessage ?? "—"}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
