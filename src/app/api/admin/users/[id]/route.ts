import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";

const updateUserSchema = z.object({
  isAdmin: z.boolean(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(`admin-users:${session.user.id}`, 30, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas, tente novamente em instantes" }, { status: 429 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (id === session.user.id && !parsed.data.isAdmin) {
    return NextResponse.json({ error: "Você não pode remover seu próprio acesso de admin" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const user = await db.user.update({
      where: { id },
      data: { isAdmin: parsed.data.isAdmin },
      select: { id: true, isAdmin: true },
    });

    return NextResponse.json(user);
  } catch (err) {
    Sentry.captureException(err, { tags: { userId: id } });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
