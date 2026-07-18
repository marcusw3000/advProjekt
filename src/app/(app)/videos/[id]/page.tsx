import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { VideoDetailClient } from "@/components/VideoDetailClient";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const video = await db.video.findUnique({
    where: { id },
    include: { segments: { orderBy: { order: "asc" } } },
  });

  if (!video || video.userId !== session.user.id) notFound();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 md:px-8 md:py-10">
      <Link
        href="/videos"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>
      <h1 className="font-heading text-2xl text-foreground">{video.title}</h1>
      <VideoDetailClient
        videoId={video.id}
        initialStatus={video.status}
        initialSegments={video.segments}
        videoSrc={video.sourceType === "UPLOAD" ? video.storageKey : null}
        initialSummary={video.summary}
        initialSummaryStatus={video.summaryStatus}
      />
    </div>
  );
}
