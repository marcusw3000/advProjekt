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

  // Single atomic UPDATE (with a same-statement CTE snapshot of the prior
  // balance) so concurrent completions for the same user can't race a
  // separate read-then-write and clobber each other's debit.
  const [result] = await tx.$queryRaw<{ old_balance: number; new_balance: number }[]>`
    WITH prev AS (
      SELECT "minutesBalance" AS old_balance FROM "User" WHERE id = ${userId}
    )
    UPDATE "User"
    SET "minutesBalance" = GREATEST("User"."minutesBalance" - ${minutes}, 0)
    FROM prev
    WHERE "User".id = ${userId}
    RETURNING prev.old_balance, "User"."minutesBalance" AS new_balance
  `;

  const debited = result ? result.old_balance - result.new_balance : 0;

  await tx.minutesTransaction.create({
    data: {
      userId,
      videoId,
      amount: -debited,
      reason: "VIDEO_TRANSCRIPTION",
    },
  });
}
