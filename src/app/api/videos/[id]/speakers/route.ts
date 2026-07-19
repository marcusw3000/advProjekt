import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const updateSpeakerSchema = z.object({
  originalSpeakerLabel: z.string().min(1).max(200),
  newLabel: z.string().trim().min(1).max(200),
});

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
  const parsed = updateSpeakerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await db.transcriptSegment.updateMany({
    where: { videoId: id, originalSpeakerLabel: parsed.data.originalSpeakerLabel },
    data: { speakerLabel: parsed.data.newLabel },
  });

  return NextResponse.json({ ok: true });
}
