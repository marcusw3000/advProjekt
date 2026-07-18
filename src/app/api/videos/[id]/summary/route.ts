import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateHearingSummary } from "@/lib/summary";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await db.video.findUnique({
    where: { id },
    include: { segments: { orderBy: { order: "asc" } } },
  });

  if (!video || video.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (video.status !== "COMPLETE" || video.segments.length === 0) {
    return NextResponse.json(
      { error: "Vídeo precisa estar com transcrição concluída" },
      { status: 400 }
    );
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
    const message = err instanceof Error ? err.message : "Falha ao gerar resumo";
    await db.video.update({
      where: { id },
      data: { summaryStatus: "FAILED", summaryError: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
