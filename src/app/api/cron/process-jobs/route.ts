import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { processTranscriptionJob } from "@/lib/jobs/processJob";
import { finalizeJobFromAsr } from "@/lib/jobs/finalizeJob";
import { handleJobFailure } from "@/lib/jobs/handleJobFailure";

export const runtime = "nodejs";
export const maxDuration = 60;

const STUCK_JOB_TIMEOUT_MS = 15 * 60 * 1000;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();

  try {
    const processingJobs = await db.transcriptionJob.findMany({
      where: { status: "PROCESSING", asrJobId: { not: null } },
    });

    await Promise.all(processingJobs.map((job) => finalizeJobFromAsr(job.id)));

    const stuckJobs = await db.transcriptionJob.findMany({
      where: {
        status: { in: ["DOWNLOADING", "PROCESSING"] },
        updatedAt: { lt: new Date(Date.now() - STUCK_JOB_TIMEOUT_MS) },
      },
    });

    for (const job of stuckJobs) {
      await handleJobFailure({
        jobId: job.id,
        videoId: job.videoId,
        attemptCount: job.attemptCount,
        errorMessage: "Job timed out",
      });
    }

    const now = new Date();
    const pendingJobs = await db.transcriptionJob.findMany({
      where: {
        status: "PENDING",
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      take: 5,
      orderBy: { createdAt: "asc" },
    });

    await Promise.all(pendingJobs.map((job) => processTranscriptionJob(job.id)));

    await db.cronRun.create({
      data: {
        startedAt,
        finishedAt: new Date(),
        reconciled: processingJobs.length,
        processed: pendingJobs.length,
        timedOut: stuckJobs.length,
      },
    });

    return NextResponse.json({
      reconciled: processingJobs.length,
      processed: pendingJobs.length,
      timedOut: stuckJobs.length,
    });
  } catch (err) {
    Sentry.captureException(err);
    await db.cronRun.create({
      data: {
        startedAt,
        finishedAt: new Date(),
        error: err instanceof Error ? err.message : "Unknown error",
      },
    });
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
