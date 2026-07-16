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
  const segment = await db.transcriptSegment.findUnique({
    where: { id },
    include: { video: true },
  });

  if (!segment || segment.video.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const text = typeof body.text === "string" ? body.text : undefined;

  if (text === undefined) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const updated = await db.transcriptSegment.update({
    where: { id },
    data: { text },
  });

  return NextResponse.json(updated);
}
