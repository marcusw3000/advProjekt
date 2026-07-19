import Link from "next/link";
import { FileVideo, Timer, Users } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/JobStatusBadge";

const REASON_LABELS: Record<string, string> = {
  SIGNUP_GRANT: "Bônus de cadastro",
  VIDEO_TRANSCRIPTION: "Transcrição de vídeo",
  PURCHASE: "Compra",
  ADMIN_ADJUSTMENT: "Ajuste manual",
};

export default async function AdminOverviewPage() {
  const [userCount, recentUsers, videosByStatus, minutesByReason] = await Promise.all([
    db.user.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, email: true, name: true, createdAt: true, minutesBalance: true },
    }),
    db.video.groupBy({ by: ["status"], _count: true }),
    db.minutesTransaction.groupBy({ by: ["reason"], _sum: { amount: true } }),
  ]);

  const totalVideos = videosByStatus.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">Estado atual do sistema.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="gap-2 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="size-3.5" />
            Usuários
          </div>
          <p className="font-heading text-3xl font-bold text-foreground">{userCount}</p>
        </Card>

        <Card className="gap-2 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FileVideo className="size-3.5" />
            Vídeos processados
          </div>
          <p className="font-heading text-3xl font-bold text-foreground">{totalVideos}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {videosByStatus.map((s) => (
              <JobStatusBadge key={s.status} status={s.status} />
            ))}
          </div>
        </Card>

        <Card className="gap-2 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Timer className="size-3.5" />
            Minutos por motivo
          </div>
          <div className="flex flex-col gap-1 pt-1">
            {minutesByReason.map((m) => (
              <div key={m.reason} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{REASON_LABELS[m.reason] ?? m.reason}</span>
                <span className="font-mono text-foreground">{m._sum.amount ?? 0} min</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
          Últimos usuários
        </h2>
        <Card className="gap-0 overflow-hidden p-0">
          <div className="grid grid-cols-[minmax(0,1fr)_112px_88px] items-center gap-4 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Email</span>
            <span>Cadastro</span>
            <span className="text-right">Saldo</span>
          </div>
          {recentUsers.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[minmax(0,1fr)_112px_88px] items-center gap-4 border-b border-border px-4 py-3 text-sm last:border-0"
            >
              <span className="truncate text-foreground">{u.name ? `${u.name} — ${u.email}` : u.email}</span>
              <span className="text-muted-foreground">
                {u.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              <span className="text-right font-mono text-muted-foreground">{u.minutesBalance} min</span>
            </div>
          ))}
        </Card>
        <div className="mt-3 text-right">
          <Link href="/admin/usuarios" className="text-sm font-medium text-primary hover:underline">
            Ver todos os usuários →
          </Link>
        </div>
      </div>
    </div>
  );
}
