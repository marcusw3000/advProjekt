import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Eye, FileVideo, Link2, Share2, Upload } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/JobStatusBadge";

function formatDuration(seconds: number | null) {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function CompartilhadosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shares = await db.videoShare.findMany({
    where: { sharedWithUserId: session.user.id },
    include: {
      video: true,
      sharedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Compartilhados</h1>
        <p className="text-sm text-muted-foreground">
          Transcrições compartilhadas com você por outros membros da equipe.
        </p>
      </div>

      {shares.length === 0 ? (
        <Card className="items-center gap-3 px-6 py-16 text-center">
          <Share2 className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhum vídeo compartilhado com você ainda</p>
            <p className="text-sm text-muted-foreground">
              Quando alguém compartilhar uma transcrição com você, ela aparecerá aqui.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="gap-0 overflow-hidden p-0" aria-label="Lista de vídeos compartilhados">
          <div
            className="hidden items-center gap-4 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(0,1fr)_140px_88px_110px_84px]"
            aria-hidden="true"
          >
            <span>Nome do Arquivo</span>
            <span>Compartilhado por</span>
            <span>Duração</span>
            <span>Status</span>
            <span className="text-right">Ações</span>
          </div>
          {shares.map(({ id, video, sharedBy }) => (
            <div
              key={id}
              className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-secondary/40 md:grid md:grid-cols-[minmax(0,1fr)_140px_88px_110px_84px] md:items-center md:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  {video.sourceType === "URL" ? (
                    <Link2 className="size-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Upload className="size-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <span className="truncate text-sm font-medium text-foreground">{video.title}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground md:contents">
                <span className="md:hidden">Compartilhado por:</span>
                <span className="truncate">{sharedBy.name ?? sharedBy.email}</span>
                <span className="md:hidden">Duração:</span>
                <span className="font-mono">{formatDuration(video.durationSeconds)}</span>
              </div>

              <div className="flex items-center justify-between gap-2 md:contents">
                <JobStatusBadge status={video.status} />
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/videos/${video.id}`}
                    aria-label={`Ver transcrição de ${video.title}`}
                    className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground md:size-8"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </Link>
                  {video.status === "COMPLETE" && (
                    <a
                      href={`/api/videos/${video.id}/export?format=txt`}
                      aria-label={`Baixar transcrição de ${video.title} em texto`}
                      className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground md:size-8"
                    >
                      <Download className="size-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
