import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, Eye, FileVideo, Link2, Upload } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { FolderNameEditor } from "@/components/FolderNameEditor";
import { DeleteFolderButton } from "@/components/DeleteFolderButton";
import { FolderAssignSelect } from "@/components/FolderAssignSelect";
import { AddVideoToFolderForm } from "@/components/AddVideoToFolderForm";

function formatDuration(seconds: number | null) {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function PastaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const folder = await db.folder.findUnique({ where: { id } });
  if (!folder || folder.userId !== session.user.id) notFound();

  const [videos, folders, otherVideos] = await Promise.all([
    db.video.findMany({ where: { folderId: id }, orderBy: { createdAt: "desc" } }),
    db.folder.findMany({ where: { userId: session.user.id }, orderBy: { name: "asc" } }),
    db.video.findMany({
      where: { userId: session.user.id, folderId: { not: id } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <Link
        href="/pastas"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Voltar às pastas
      </Link>

      <div className="flex items-center justify-between gap-4">
        <FolderNameEditor
          folderId={folder.id}
          initialName={folder.name}
          className="font-heading text-2xl font-bold text-foreground"
        />
        <DeleteFolderButton folderId={folder.id} folderName={folder.name} />
      </div>

      <AddVideoToFolderForm folderId={folder.id} availableVideos={otherVideos} />

      {videos.length === 0 ? (
        <Card className="items-center gap-3 px-6 py-16 text-center">
          <FileVideo className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhum vídeo nesta pasta</p>
            <p className="text-sm text-muted-foreground">Adicione um vídeo existente acima.</p>
          </div>
        </Card>
      ) : (
        <Card className="gap-0 overflow-hidden p-0">
          <div className="grid grid-cols-[minmax(0,1fr)_112px_88px_110px_140px_84px] items-center gap-4 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Nome do Arquivo</span>
            <span>Data</span>
            <span>Duração</span>
            <span>Status</span>
            <span>Pasta</span>
            <span className="text-right">Ações</span>
          </div>
          {videos.map((video) => (
            <div
              key={video.id}
              className="grid grid-cols-[minmax(0,1fr)_112px_88px_110px_140px_84px] items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-secondary/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  {video.sourceType === "URL" ? (
                    <Link2 className="size-4 text-muted-foreground" />
                  ) : (
                    <Upload className="size-4 text-muted-foreground" />
                  )}
                </div>
                <span className="truncate text-sm font-medium text-foreground">{video.title}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(video.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="font-mono text-sm text-muted-foreground">
                {formatDuration(video.durationSeconds)}
              </span>
              <div>
                <JobStatusBadge status={video.status} />
              </div>
              <FolderAssignSelect videoId={video.id} folders={folders} currentFolderId={video.folderId} />
              <div className="flex items-center justify-end gap-1">
                <Link
                  href={`/videos/${video.id}`}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Eye className="size-4" />
                </Link>
                {video.status === "COMPLETE" && (
                  <a
                    href={`/api/videos/${video.id}/export?format=txt`}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Download className="size-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
