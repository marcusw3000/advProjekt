import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toTxt } from "@/lib/export/txt";
import { toSrt } from "@/lib/export/srt";
import { toVtt } from "@/lib/export/vtt";

const CONTENT_TYPES: Record<string, string> = {
  txt: "text/plain; charset=utf-8",
  srt: "application/x-subrip; charset=utf-8",
  vtt: "text/vtt; charset=utf-8",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format") ?? "txt";

  if (!(format in CONTENT_TYPES)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const video = await db.video.findUnique({
    where: { id },
    include: { segments: { orderBy: { order: "asc" } } },
  });

  if (!video || video.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body =
    format === "srt" ? toSrt(video.segments) : format === "vtt" ? toVtt(video.segments) : toTxt(video.segments);

  const safeTitle = video.title.replace(/[^a-zA-Z0-9-_]+/g, "_");

  return new NextResponse(body, {
    headers: {
      "Content-Type": CONTENT_TYPES[format],
      "Content-Disposition": `attachment; filename="${safeTitle}.${format}"`,
    },
  });
}
