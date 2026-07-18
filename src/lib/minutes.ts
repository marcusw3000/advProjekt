import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export { MINUTES_SIGNUP_GRANT } from "@/lib/minutesConfig";

export async function getMinutesBalance(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { minutesBalance: true } });
  return user?.minutesBalance ?? 0;
}

export async function debitMinutesForCompletedVideo(
  tx: Prisma.TransactionClient,
  userId: string,
  videoId: string,
  durationSeconds: number
) {
  const minutes = Math.max(1, Math.ceil(durationSeconds / 60));
  await tx.user.update({
    where: { id: userId },
    data: { minutesBalance: { decrement: minutes } },
  });
  await tx.minutesTransaction.create({
    data: {
      userId,
      videoId,
      amount: -minutes,
      reason: "VIDEO_TRANSCRIPTION",
    },
  });
}
