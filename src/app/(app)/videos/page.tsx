import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Eye, FileVideo, Link2, Plus, Timer, Upload } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMinutesBalance } from "@/lib/minutes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { VideoTitleEditor } from "@/components/VideoTitleEditor";
import { DeleteVideoButton } from "@/components/DeleteVideoButton";

function formatDuration(seconds: number | null) {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function VideosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [videos, minutesBalance] = await Promise.all([
    db.video.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    getMinutesBalance(session.user.id),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="gap-3 bg-primary p-8 text-primary-foreground md:col-span-2">
          <h1 className="font-heading text-2xl font-bold">Nova Transcrição Jurídica</h1>
          <p className="max-w-md text-sm text-primary-foreground/70">
            Processe audiências, depoimentos e reuniões com precisão de 99%. Suporte para
            múltiplos oradores e carimbos de tempo automáticos.
          </p>
          <Button
            render={<Link href="/videos/new" />}
            nativeButton={false}
            className="mt-2 w-fit bg-white text-primary hover:bg-white/90"
          >
            <Plus className="size-4" />
            Novo Arquivo
          </Button>
        </Card>

        <Card className="justify-between gap-2 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Timer className="size-3.5" />
            Créditos Disponíveis
          </div>
          <p className="font-heading text-3xl font-bold text-foreground">{minutesBalance} min</p>
          <Link href="/precos" className="text-sm font-medium text-foreground hover:underline">
            Comprar mais minutos →
          </Link>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Últimas Audiências
            </h2>
            <p className="text-sm text-muted-foreground">
              Gerencie seus arquivos processados recentemente.
            </p>
          </div>
        </div>

        {videos.length === 0 ? (
          <Card className="mt-4 items-center gap-3 px-6 py-16 text-center">
            <FileVideo className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Nenhum vídeo enviado ainda</p>
              <p className="text-sm text-muted-foreground">
                Comece enviando seu primeiro vídeo pra transcrever.
              </p>
            </div>
            <Button
              render={<Link href="/videos/new" />}
              nativeButton={false}
              className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Enviar seu primeiro vídeo
            </Button>
          </Card>
        ) : (
          <Card className="mt-4 gap-0 overflow-hidden p-0" aria-label="Lista de audiências">
            <div
              className="hidden items-center gap-4 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(0,1fr)_112px_88px_110px_84px]"
              aria-hidden="true"
            >
              <span>Nome do Arquivo</span>
              <span>Data</span>
              <span>Duração</span>
              <span>Status</span>
              <span className="text-right">Ações</span>
            </div>
            {videos.map((video) => {
              const dateLabel = new Date(video.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              return (
                <div
                  key={video.id}
                  className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-secondary/40 md:grid md:grid-cols-[minmax(0,1fr)_112px_88px_110px_84px] md:items-center md:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      {video.sourceType === "URL" ? (
                        <Link2 className="size-4 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        <Upload className="size-4 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                    <VideoTitleEditor
                      videoId={video.id}
                      initialTitle={video.title}
                      className="text-sm font-medium text-foreground"
                      inputClassName="text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground md:contents">
                    <span className="md:hidden">Data:</span>
                    <span>{dateLabel}</span>
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
                      <DeleteVideoButton videoId={video.id} videoTitle={video.title} compact />
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
