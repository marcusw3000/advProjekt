import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getVideoAccess } from "@/lib/videoAccess";
import { VideoDetailClient } from "@/components/VideoDetailClient";
import { VideoTitleEditor } from "@/components/VideoTitleEditor";
import { FolderAssignSelect } from "@/components/FolderAssignSelect";
import { DeleteVideoButton } from "@/components/DeleteVideoButton";
import { ShareVideoDialog } from "@/components/ShareVideoDialog";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const access = await getVideoAccess(id, session.user.id);
  if (!access) notFound();
  const { video, role } = access;

  const [segments, folders, shares] = await Promise.all([
    db.transcriptSegment.findMany({ where: { videoId: id }, orderBy: { order: "asc" } }),
    role === "owner"
      ? db.folder.findMany({ where: { userId: session.user.id }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    role === "owner"
      ? db.videoShare.findMany({
          where: { videoId: id },
          include: { sharedWith: { select: { id: true, email: true, name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

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
        {role === "owner" && (
          <div className="flex items-center gap-2">
            <ShareVideoDialog videoId={video.id} videoTitle={video.title} initialShares={shares} />
            <FolderAssignSelect videoId={video.id} folders={folders} currentFolderId={video.folderId} />
            <DeleteVideoButton videoId={video.id} videoTitle={video.title} />
          </div>
        )}
      </div>
      <VideoDetailClient
        videoId={video.id}
        initialStatus={video.status}
        initialSegments={segments}
        videoSrc={videoSrc}
        initialSummary={video.summary}
        initialSummaryStatus={video.summaryStatus}
        canRetry={role === "owner"}
      />
    </div>
  );
}
