import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getVideoAccess } from "@/lib/videoAccess";
import { generateHearingSummary } from "@/lib/summary";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(`summary:${session.user.id}`, 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas, tente novamente em instantes" }, { status: 429 });
  }

  const { id } = await params;
  const access = await getVideoAccess(id, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const video = {
    ...access.video,
    segments: await db.transcriptSegment.findMany({ where: { videoId: id }, orderBy: { order: "asc" } }),
  };

  if (video.status !== "COMPLETE" || video.segments.length === 0) {
    return NextResponse.json(
      { error: "Vídeo precisa estar com transcrição concluída" },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";
  if (video.summaryStatus === "COMPLETE" && !force) {
    return NextResponse.json({
      summary: video.summary,
      summaryStatus: video.summaryStatus,
      summaryGeneratedAt: video.summaryGeneratedAt,
    });
  }

  await db.video.update({ where: { id }, data: { summaryStatus: "PROCESSING" } });

  try {
    const summary = await generateHearingSummary(video.segments);
    const updated = await db.video.update({
      where: { id },
      data: {
        summary,
        summaryStatus: "COMPLETE",
        summaryError: null,
        summaryGeneratedAt: new Date(),
      },
    });

    return NextResponse.json({
      summary: updated.summary,
      summaryStatus: updated.summaryStatus,
      summaryGeneratedAt: updated.summaryGeneratedAt,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { videoId: id } });
    const message = "Falha ao gerar resumo";
    await db.video.update({
      where: { id },
      data: { summaryStatus: "FAILED", summaryError: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
