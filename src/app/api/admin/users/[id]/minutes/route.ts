import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";

const adjustMinutesSchema = z.object({
  minutesBalance: z.number().int().min(0),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(`admin-minutes:${session.user.id}`, 30, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas, tente novamente em instantes" }, { status: 429 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = adjustMinutesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id }, select: { minutesBalance: true } });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const delta = parsed.data.minutesBalance - user.minutesBalance;

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.user.update({
      where: { id },
      data: { minutesBalance: parsed.data.minutesBalance },
      select: { id: true, minutesBalance: true },
    });
    if (delta !== 0) {
      await tx.minutesTransaction.create({
        data: { userId: id, amount: delta, reason: "ADMIN_ADJUSTMENT" },
      });
    }
    return result;
  });

  return NextResponse.json(updated);
}
