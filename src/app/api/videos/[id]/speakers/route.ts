import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await db.video.findUnique({ where: { id } });
  if (!video || video.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const originalSpeakerLabel = typeof body.originalSpeakerLabel === "string" ? body.originalSpeakerLabel : "";
  const newLabel = typeof body.newLabel === "string" ? body.newLabel.trim() : "";

  if (!originalSpeakerLabel || !newLabel) {
    return NextResponse.json({ error: "Missing originalSpeakerLabel or newLabel" }, { status: 400 });
  }

  await db.transcriptSegment.updateMany({
    where: { videoId: id, originalSpeakerLabel },
    data: { speakerLabel: newLabel },
  });

  return NextResponse.json({ ok: true });
}
