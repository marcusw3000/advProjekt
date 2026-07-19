import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { sendJobFailedEmail } from "@/lib/email";
import { getBackoffMs, shouldRetry } from "@/lib/jobs/retryPolicy";

export async function handleJobFailure(params: {
  jobId: string;
  videoId: string;
  attemptCount: number;
  errorMessage: string;
}) {
  const { jobId, videoId, attemptCount, errorMessage } = params;

  if (shouldRetry(attemptCount)) {
    await db.transcriptionJob.update({
      where: { id: jobId },
      data: {
        status: "PENDING",
        attemptCount: attemptCount + 1,
        nextRetryAt: new Date(Date.now() + getBackoffMs(attemptCount)),
        errorMessage,
      },
    });
    await db.video.update({ where: { id: videoId }, data: { status: "PENDING" } });
    return;
  }

  await db.transcriptionJob.update({
    where: { id: jobId },
    data: { status: "FAILED", attemptCount: attemptCount + 1, errorMessage },
  });
  await db.video.update({ where: { id: videoId }, data: { status: "FAILED" } });

  try {
    const video = await db.video.findUnique({
      where: { id: videoId },
      include: { user: { select: { email: true } } },
    });
    const admins = await db.user.findMany({ where: { isAdmin: true }, select: { email: true } });
    const recipients = [
      ...(video ? [video.user.email] : []),
      ...admins.map((a) => a.email),
    ];
    await sendJobFailedEmail([...new Set(recipients)], video?.title ?? "vídeo");
  } catch (err) {
    Sentry.captureException(err, { tags: { jobId } });
  }
}
