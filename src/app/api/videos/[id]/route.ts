import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteVideoAssets } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await db.video.findUnique({
    where: { id },
    include: { segments: { orderBy: { order: "asc" } } },
  });

  if (!video || video.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(video);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.video.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const data: { title?: string; folderId?: string | null } = {};

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Título inválido" }, { status: 400 });
    }
    data.title = title.slice(0, 200);
  }

  if (body.folderId !== undefined) {
    if (body.folderId === null) {
      data.folderId = null;
    } else if (typeof body.folderId === "string") {
      const folder = await db.folder.findUnique({ where: { id: body.folderId } });
      if (!folder || folder.userId !== session.user.id) {
        return NextResponse.json({ error: "Pasta inválida" }, { status: 400 });
      }
      data.folderId = body.folderId;
    } else {
      return NextResponse.json({ error: "Pasta inválida" }, { status: 400 });
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const video = await db.video.update({
    where: { id, userId: session.user.id },
    data,
  });

  return NextResponse.json({ id: video.id, title: video.title, folderId: video.folderId });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.video.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.sourceType === "UPLOAD") {
    await deleteVideoAssets(id).catch(() => {});
  }

  await db.video.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
