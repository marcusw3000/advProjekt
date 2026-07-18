import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { SIGNUP_GRANT_CREDITS } from "@/lib/creditsConfig";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password, name } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email, passwordHash, name },
    });
    await tx.creditTransaction.create({
      data: { userId: created.id, amount: SIGNUP_GRANT_CREDITS, reason: "SIGNUP_GRANT" },
    });
    return created;
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
