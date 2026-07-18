import { db } from "@/lib/db";
import { assemblyAiProvider } from "@/lib/asr/assemblyai";
import { guessSpeakerNames } from "@/lib/jobs/guessSpeakerNames";
import { guessAddressedSpeakerNames } from "@/lib/jobs/guessAddressedSpeakerNames";
import { debitForCompletedVideo } from "@/lib/credits";

export async function finalizeJobFromAsr(jobId: string) {
  const job = await db.transcriptionJob.findUnique({ where: { id: jobId }, include: { video: true } });
  if (!job || !job.asrJobId) return;

  const transcript = await assemblyAiProvider.getTranscript(job.asrJobId);

  if (transcript.status === "error") {
    await db.transcriptionJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: transcript.error ?? "ASR error" },
    });
    await db.video.update({ where: { id: job.videoId }, data: { status: "FAILED" } });
    return;
  }

  if (transcript.status !== "completed") return;

  const speakerNames = {
    ...guessAddressedSpeakerNames(transcript.utterances),
    ...guessSpeakerNames(transcript.utterances),
  };

  await db.$transaction(async (tx) => {
    await tx.transcriptSegment.deleteMany({ where: { videoId: job.videoId } });
    await tx.transcriptSegment.createMany({
      data: transcript.utterances.map((u, index) => ({
        videoId: job.videoId,
        speakerLabel: speakerNames[u.speaker] ?? u.speaker,
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
    await tx.video.update({ where: { id: job.videoId }, data: { status: "COMPLETE" } });
    await debitForCompletedVideo(tx, job.video.userId, job.videoId);
  });
}
