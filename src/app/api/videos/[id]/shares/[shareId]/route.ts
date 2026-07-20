import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, shareId } = await params;
  const video = await db.video.findUnique({ where: { id } });
  if (!video || video.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const share = await db.videoShare.findUnique({ where: { id: shareId } });
  if (!share || share.videoId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.videoShare.delete({ where: { id: shareId } });

  return NextResponse.json({ ok: true });
}
