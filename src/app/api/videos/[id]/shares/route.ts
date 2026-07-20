import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const createShareSchema = z.object({
  email: z.string().trim().email(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await db.video.findUnique({ where: { id } });
  if (!video || video.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const shares = await db.videoShare.findMany({
    where: { videoId: id },
    include: { sharedWith: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(shares);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await db.video.findUnique({ where: { id } });
  if (!video || video.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createShareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const targetUser = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!targetUser) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (targetUser.id === session.user.id) {
    return NextResponse.json({ error: "Você já tem acesso a este vídeo" }, { status: 400 });
  }

  const share = await db.videoShare.upsert({
    where: { videoId_sharedWithUserId: { videoId: id, sharedWithUserId: targetUser.id } },
    create: { videoId: id, sharedByUserId: session.user.id, sharedWithUserId: targetUser.id },
    update: {},
    include: { sharedWith: { select: { id: true, email: true, name: true } } },
  });

  return NextResponse.json(share);
}
