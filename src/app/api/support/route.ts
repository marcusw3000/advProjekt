import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendSupportTicketEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { supportTicketSchema } from "@/lib/supportTicketSchema";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(`support:${session.user.id}`, 5, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas, tente novamente em instantes" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = supportTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { subject, message } = parsed.data;

  const ticket = await db.supportTicket.create({
    data: { userId: session.user.id, subject, message },
  });

  try {
    const admins = await db.user.findMany({ where: { isAdmin: true }, select: { email: true } });
    await sendSupportTicketEmail(admins.map((a) => a.email), subject, message, session.user.email ?? "");
  } catch (err) {
    Sentry.captureException(err);
  }

  return NextResponse.json({ id: ticket.id });
}
