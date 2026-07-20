import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getVideoAccess } from "@/lib/videoAccess";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getVideoAccess(id, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const job = await db.transcriptionJob.findUnique({ where: { videoId: id } });

  return NextResponse.json({
    status: access.video.status,
    errorMessage: job?.errorMessage ?? null,
  });
}
