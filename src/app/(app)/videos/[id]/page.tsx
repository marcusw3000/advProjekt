import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { VideoDetailClient } from "@/components/VideoDetailClient";
import { VideoTitleEditor } from "@/components/VideoTitleEditor";
import { FolderAssignSelect } from "@/components/FolderAssignSelect";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const [video, folders] = await Promise.all([
    db.video.findUnique({
      where: { id },
      include: { segments: { orderBy: { order: "asc" } } },
    }),
    db.folder.findMany({ where: { userId: session.user.id }, orderBy: { name: "asc" } }),
  ]);

  if (!video || video.userId !== session.user.id) notFound();

  const videoSrc = video.sourceType === "UPLOAD" ? video.storageKey : null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 md:px-8 md:py-10">
      <Link
        href="/videos"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VideoTitleEditor
          videoId={video.id}
          initialTitle={video.title}
          className="font-heading text-2xl text-foreground"
          inputClassName="font-heading text-2xl"
        />
        <FolderAssignSelect videoId={video.id} folders={folders} currentFolderId={video.folderId} />
      </div>
      <VideoDetailClient
        videoId={video.id}
        initialStatus={video.status}
        initialSegments={video.segments}
        videoSrc={videoSrc}
        initialSummary={video.summary}
        initialSummaryStatus={video.summaryStatus}
      />
    </div>
  );
}
