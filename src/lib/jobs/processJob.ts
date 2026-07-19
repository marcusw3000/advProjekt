import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { assemblyAiProvider } from "@/lib/asr/assemblyai";
import { resolveAudioUrl } from "@/lib/jobs/resolveAudioUrl";
import { handleJobFailure } from "@/lib/jobs/handleJobFailure";
import { signWebhookToken } from "@/lib/jobs/webhookToken";

function webhookUrl(jobId: string) {
  const base = process.env.APP_URL;
  if (!base) throw new Error("APP_URL is not set");
  const token = signWebhookToken(jobId);
  return `${base}/api/webhooks/assemblyai?jobId=${jobId}&token=${token}`;
}

export async function processTranscriptionJob(jobId: string) {
  const job = await db.transcriptionJob.findUnique({
    where: { id: jobId },
    include: { video: true },
  });

  if (!job || job.status !== "PENDING") return;

  try {
    await db.transcriptionJob.update({
      where: { id: jobId },
      data: { status: "DOWNLOADING" },
    });
    await db.video.update({ where: { id: job.videoId }, data: { status: "DOWNLOADING" } });

    const audioUrl = await resolveAudioUrl(job.video);

    await db.transcriptionJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });
    await db.video.update({ where: { id: job.videoId }, data: { status: "PROCESSING" } });

    const { asrJobId } = await assemblyAiProvider.submitTranscription({
      audioUrl,
      webhookUrl: webhookUrl(jobId),
    });

    await db.transcriptionJob.update({
      where: { id: jobId },
      data: { asrJobId },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { jobId } });
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await handleJobFailure({ jobId, videoId: job.videoId, attemptCount: job.attemptCount, errorMessage });
  }
}
