import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { generateSignedUploadUrl } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB sanity cap for MVP
const ALLOWED_CONTENT_TYPES = /^(video|audio)\//;

function extensionFromFileName(fileName: string) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  return match ? match[1].toLowerCase() : "bin";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(`video-upload:${session.user.id}`, 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas, tente novamente em instantes" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const fileName = typeof body.fileName === "string" ? body.fileName : "";
    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;

    if (!ALLOWED_CONTENT_TYPES.test(contentType)) {
      return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
    }
    if (fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande (máx 500MB)" }, { status: 413 });
    }

    const key = `videos/${session.user.id}/${randomUUID()}/original.${extensionFromFileName(fileName)}`;
    const { url, publicUrl } = await generateSignedUploadUrl(key, contentType);

    return NextResponse.json({ uploadUrl: url, publicUrl, key, contentType, fileSize });
  } catch (error) {
    Sentry.captureException(error, { tags: { userId: session.user.id } });
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}
