import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assemblyAiProvider } from "@/lib/asr/assemblyai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  const job = await db.transcriptionJob.findUnique({ where: { id: jobId } });
  if (!job || !job.asrJobId) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const transcript = await assemblyAiProvider.getTranscript(job.asrJobId);

  if (transcript.status === "error") {
    await db.transcriptionJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: transcript.error ?? "ASR error" },
    });
    await db.video.update({ where: { id: job.videoId }, data: { status: "FAILED" } });
    return NextResponse.json({ ok: true });
  }

  if (transcript.status !== "completed") {
    return NextResponse.json({ ok: true });
  }

  await db.$transaction([
    db.transcriptSegment.deleteMany({ where: { videoId: job.videoId } }),
    db.transcriptSegment.createMany({
      data: transcript.utterances.map((u, index) => ({
        videoId: job.videoId,
        speakerLabel: u.speaker,
        originalSpeakerLabel: u.speaker,
        startMs: u.startMs,
        endMs: u.endMs,
        text: u.text,
        order: index,
      })),
    }),
    db.transcriptionJob.update({
      where: { id: jobId },
      data: { status: "COMPLETE", completedAt: new Date() },
    }),
    db.video.update({ where: { id: job.videoId }, data: { status: "COMPLETE" } }),
  ]);

  return NextResponse.json({ ok: true });
}
