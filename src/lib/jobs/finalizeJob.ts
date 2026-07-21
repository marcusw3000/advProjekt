import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { assemblyAiProvider } from "@/lib/asr/assemblyai";
import { guessSpeakerNames } from "@/lib/jobs/guessSpeakerNames";
import { guessAddressedSpeakerNames } from "@/lib/jobs/guessAddressedSpeakerNames";
import { guessSpeakerRoles } from "@/lib/jobs/guessSpeakerRoles";
import { debitMinutesForCompletedVideo } from "@/lib/minutes";
import { handleJobFailure } from "@/lib/jobs/handleJobFailure";

export async function finalizeJobFromAsr(jobId: string) {
  const job = await db.transcriptionJob.findUnique({ where: { id: jobId }, include: { video: true } });
  if (!job || !job.asrJobId) return;

  try {
    const transcript = await assemblyAiProvider.getTranscript(job.asrJobId);

    if (transcript.status === "error") {
      Sentry.captureMessage("ASR transcription failed", { tags: { jobId }, extra: { error: transcript.error } });
      await handleJobFailure({
        jobId,
        videoId: job.videoId,
        attemptCount: job.attemptCount,
        errorMessage: transcript.error ?? "ASR error",
      });
      return;
    }

    if (transcript.status !== "completed") return;

    const speakerNames = {
      ...guessAddressedSpeakerNames(transcript.utterances),
      ...guessSpeakerNames(transcript.utterances),
    };
    const speakerRoles = guessSpeakerRoles(transcript.utterances);

    const labelFor = (speaker: string): string => {
      const name = speakerNames[speaker];
      const role = speakerRoles[speaker];
      if (name && role) return `${name} (${role})`;
      if (role) return role;
      if (name) return name;
      return speaker;
    };

    const maxEndMs = transcript.utterances.reduce((max, u) => Math.max(max, u.endMs), 0);
    const durationSeconds = transcript.durationSeconds ?? Math.ceil(maxEndMs / 1000);

    await db.$transaction(async (tx) => {
      await tx.transcriptSegment.deleteMany({ where: { videoId: job.videoId } });
      await tx.transcriptSegment.createMany({
        data: transcript.utterances.map((u, index) => ({
          videoId: job.videoId,
          speakerLabel: labelFor(u.speaker),
          originalSpeakerLabel: u.speaker,
          startMs: u.startMs,
          endMs: u.endMs,
          text: u.text,
          order: index,
        })),
      });
      await tx.transcriptionJob.update({
        where: { id: jobId },
        data: { status: "COMPLETE", completedAt: new Date() },
      });
      await tx.video.update({
        where: { id: job.videoId },
        data: { status: "COMPLETE", durationSeconds },
      });
      await debitMinutesForCompletedVideo(tx, job.video.userId, job.videoId, durationSeconds);
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { jobId } });
    await handleJobFailure({
      jobId,
      videoId: job.videoId,
      attemptCount: job.attemptCount,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
