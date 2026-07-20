import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { processTranscriptionJob } from "@/lib/jobs/processJob";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(`retry:${session.user.id}`, 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas, tente novamente em instantes" }, { status: 429 });
  }

  const { id } = await params;
  const video = await db.video.findUnique({ where: { id }, include: { job: true } });

  if (!video || video.userId !== session.user.id || !video.job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Retry re-runs the transcription job on the owner's minutes balance — owner only.

  if (video.job.status !== "FAILED") {
    return NextResponse.json({ error: "Job is not in a FAILED state" }, { status: 409 });
  }

  await db.transcriptionJob.update({
    where: { id: video.job.id, videoId: video.id },
    data: { status: "PENDING", errorMessage: null, asrJobId: null, attemptCount: 0, nextRetryAt: null },
  });
  await db.video.update({ where: { id, userId: session.user.id }, data: { status: "PENDING" } });

  void processTranscriptionJob(video.job.id).catch(() => {});

  return NextResponse.json({ ok: true });
}
