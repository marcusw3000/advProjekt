import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { CREDIT_COST_PER_VIDEO } from "@/lib/creditsConfig";

export { CREDIT_COST_PER_VIDEO, SIGNUP_GRANT_CREDITS } from "@/lib/creditsConfig";

export async function getCredits(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { credits: true } });
  return user?.credits ?? 0;
}

export async function debitForCompletedVideo(
  tx: Prisma.TransactionClient,
  userId: string,
  videoId: string
) {
  await tx.user.update({
    where: { id: userId },
    data: { credits: { decrement: CREDIT_COST_PER_VIDEO } },
  });
  await tx.creditTransaction.create({
    data: {
      userId,
      videoId,
      amount: -CREDIT_COST_PER_VIDEO,
      reason: "VIDEO_TRANSCRIPTION",
    },
  });
}
