import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getVideoAccess } from "@/lib/videoAccess";
import { toTxt } from "@/lib/export/txt";
import { toDocx } from "@/lib/export/docx";
import { toPdf } from "@/lib/export/pdf";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  txt: "text/plain; charset=utf-8",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
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

  const access = await getVideoAccess(id, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const video = {
    ...access.video,
    segments: await db.transcriptSegment.findMany({ where: { videoId: id }, orderBy: { order: "asc" } }),
  };

  const body =
    format === "docx"
      ? await toDocx(video.segments, video.title)
      : format === "pdf"
        ? await toPdf(video.segments, video.title)
        : toTxt(video.segments);

  const safeTitle = video.title.replace(/[^a-zA-Z0-9-_]+/g, "_");
  const responseBody = typeof body === "string" ? body : new Uint8Array(body);

  return new NextResponse(responseBody, {
    headers: {
      "Content-Type": CONTENT_TYPES[format],
      "Content-Disposition": `attachment; filename="${safeTitle}.${format}"`,
    },
  });
}
