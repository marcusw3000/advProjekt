import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const updateSegmentSchema = z.object({
  text: z.string().max(10000),
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
  const segment = await db.transcriptSegment.findUnique({
    where: { id },
    include: { video: true },
  });

  if (!segment || segment.video.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSegmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await db.transcriptSegment.update({
    where: { id, videoId: segment.videoId },
    data: { text: parsed.data.text },
  });

  return NextResponse.json(updated);
}
