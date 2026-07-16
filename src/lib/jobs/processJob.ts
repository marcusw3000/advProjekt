import { db } from "@/lib/db";
import { assemblyAiProvider } from "@/lib/asr/assemblyai";
import { resolveAudioUrl } from "@/lib/jobs/resolveAudioUrl";

function webhookUrl(jobId: string) {
  const base = process.env.APP_URL;
  if (!base) throw new Error("APP_URL is not set");
  return `${base}/api/webhooks/assemblyai?jobId=${jobId}`;
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
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await db.transcriptionJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage },
    });
    await db.video.update({ where: { id: job.videoId }, data: { status: "FAILED" } });
  }
}
