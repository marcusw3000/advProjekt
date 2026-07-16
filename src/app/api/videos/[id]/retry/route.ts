import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { processTranscriptionJob } from "@/lib/jobs/processJob";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await db.video.findUnique({ where: { id }, include: { job: true } });

  if (!video || video.userId !== session.user.id || !video.job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (video.job.status !== "FAILED") {
    return NextResponse.json({ error: "Job is not in a FAILED state" }, { status: 409 });
  }

  await db.transcriptionJob.update({
    where: { id: video.job.id },
    data: { status: "PENDING", errorMessage: null, asrJobId: null },
  });
  await db.video.update({ where: { id }, data: { status: "PENDING" } });

  void processTranscriptionJob(video.job.id).catch(() => {});

  return NextResponse.json({ ok: true });
}
