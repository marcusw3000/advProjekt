import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(`video-upload:${session.user.id}`, 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas, tente novamente em instantes" }, { status: 429 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["video/*", "audio/*"],
        maximumSizeInBytes: 500 * 1024 * 1024,
        addRandomSuffix: false,
      }),
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    Sentry.captureException(error, { tags: { userId: session.user.id } });
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}
