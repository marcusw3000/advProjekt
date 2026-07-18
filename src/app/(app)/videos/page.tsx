import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Clock, FileVideo, Link2, Plus, Upload } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/JobStatusBadge";

function formatDuration(seconds: number | null) {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function VideosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const videos = await db.video.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Meus vídeos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse e gerencie todos os seus arquivos processados.
          </p>
        </div>
        <Button
          render={<Link href="/videos/new" />}
          nativeButton={false}
          className="bg-gradient-brand text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" />
          Novo vídeo
        </Button>
      </div>

      {videos.length === 0 ? (
        <Card className="items-center gap-3 px-6 py-16 text-center ring-border/60">
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
            className="mt-2 bg-gradient-brand text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" />
            Enviar seu primeiro vídeo
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {videos.map((video) => (
            <Link key={video.id} href={`/videos/${video.id}`}>
              <Card className="flex-col gap-4 p-4 ring-border/60 transition-colors hover:bg-accent/20 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4 sm:items-center">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {video.sourceType === "URL" ? (
                      <Link2 className="size-4 text-muted-foreground" />
                    ) : (
                      <Upload className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{video.title}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {new Date(video.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="size-1 rounded-full bg-border" />
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {formatDuration(video.durationSeconds)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-3 sm:justify-end sm:border-0 sm:pt-0">
                  <JobStatusBadge status={video.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
