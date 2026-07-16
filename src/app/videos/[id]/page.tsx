import Link from "next/link";
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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-8">
      <Link href="/videos" className="text-sm underline">
        &larr; Voltar
      </Link>
      <h1 className="text-2xl font-semibold">{video.title}</h1>
      <VideoDetailClient
        videoId={video.id}
        initialStatus={video.status}
        initialSegments={video.segments}
      />
    </div>
  );
}
