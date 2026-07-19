import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folders = await db.folder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { videos: true } } },
  });

  return NextResponse.json(
    folders.map((f) => ({ id: f.id, name: f.name, createdAt: f.createdAt, videoCount: f._count.videos }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const folder = await db.folder.create({
    data: { userId: session.user.id, name: parsed.data.name },
  });

  return NextResponse.json(folder, { status: 201 });
}
