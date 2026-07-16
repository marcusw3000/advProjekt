import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processTranscriptionJob } from "@/lib/jobs/processJob";

export const runtime = "nodejs";
export const maxDuration = 60;

const STUCK_JOB_TIMEOUT_MS = 15 * 60 * 1000;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stuckJobs = await db.transcriptionJob.findMany({
    where: {
      status: { in: ["DOWNLOADING", "PROCESSING"] },
      updatedAt: { lt: new Date(Date.now() - STUCK_JOB_TIMEOUT_MS) },
    },
  });

  for (const job of stuckJobs) {
    await db.transcriptionJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorMessage: "Job timed out" },
    });
    await db.video.update({ where: { id: job.videoId }, data: { status: "FAILED" } });
  }

  const pendingJobs = await db.transcriptionJob.findMany({
    where: { status: "PENDING" },
    take: 5,
    orderBy: { createdAt: "asc" },
  });

  await Promise.all(pendingJobs.map((job) => processTranscriptionJob(job.id)));

  return NextResponse.json({ processed: pendingJobs.length, timedOut: stuckJobs.length });
}
