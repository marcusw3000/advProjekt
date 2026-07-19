import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { generatePasswordResetToken, PASSWORD_RESET_TOKEN_TTL_MS } from "@/lib/passwordReset";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const ipAllowed = await checkRateLimit(`forgot-password:${getClientIp(req)}`, 10, 3600);
  if (!ipAllowed) {
    return NextResponse.json({ error: "Muitas tentativas, tente novamente em instantes" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email } = parsed.data;

  const emailAllowed = await checkRateLimit(`forgot-password:${email}`, 3, 3600);
  if (!emailAllowed) {
    return NextResponse.json({ error: "Muitas tentativas, tente novamente em instantes" }, { status: 429 });
  }

  try {
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      const { token, tokenHash } = generatePasswordResetToken();
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
        },
      });

      const resetUrl = `${process.env.APP_URL}/redefinir-senha?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }
  } catch (err) {
    Sentry.captureException(err);
  }

  return NextResponse.json({ ok: true });
}
