import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadVideoBlob } from "@/lib/storage";
import { processTranscriptionJob } from "@/lib/jobs/processJob";
import { CREDIT_COST_PER_VIDEO, getCredits } from "@/lib/credits";

class InsufficientCreditsError extends Error {}

export const runtime = "nodejs";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB sanity cap for MVP

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const videos = await db.video.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(videos);
}

async function createVideoAndStartJob(
  userId: string,
  data: { title: string; sourceType: "UPLOAD" | "URL"; storageKey?: string; sourceUrl?: string }
) {
  const credits = await getCredits(userId);
  if (credits < CREDIT_COST_PER_VIDEO) throw new InsufficientCreditsError();

  const video = await db.video.create({
    data: {
      userId,
      title: data.title,
      sourceType: data.sourceType,
      storageKey: data.storageKey,
      sourceUrl: data.sourceUrl,
      status: "PENDING",
      job: { create: {} },
    },
    include: { job: true },
  });

  if (video.job) void processTranscriptionJob(video.job.id).catch(() => {});

  return video;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await handleCreateVideo(req, session.user.id);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: "Créditos insuficientes" }, { status: 402 });
    }
    throw err;
  }
}

async function handleCreateVideo(req: Request, userId: string) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await req.json();

    const blobUrl = typeof body.blobUrl === "string" ? body.blobUrl.trim() : "";
    if (blobUrl) {
      let parsedBlobUrl: URL;
      try {
        parsedBlobUrl = new URL(blobUrl);
      } catch {
        return NextResponse.json({ error: "Invalid blobUrl" }, { status: 400 });
      }
      if (parsedBlobUrl.hostname !== "blob.vercel-storage.com" && !parsedBlobUrl.hostname.endsWith(".public.blob.vercel-storage.com")) {
        return NextResponse.json({ error: "Invalid blobUrl" }, { status: 400 });
      }

      const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Vídeo";

      const video = await createVideoAndStartJob(userId, {
        title,
        sourceType: "UPLOAD",
        storageKey: blobUrl,
      });

      return NextResponse.json(video, { status: 201 });
    }

    const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : sourceUrl;

    if (!sourceUrl) {
      return NextResponse.json({ error: "Missing sourceUrl" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const video = await createVideoAndStartJob(userId, {
      title,
      sourceType: "URL",
      sourceUrl,
    });

    return NextResponse.json(video, { status: 201 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const titleField = form.get("title");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 500MB)" }, { status: 413 });
  }

  const title = typeof titleField === "string" && titleField.trim() ? titleField.trim() : file.name;
  const key = `videos/${userId}/${Date.now()}-${file.name}`;

  const url = await uploadVideoBlob(key, file);

  const video = await createVideoAndStartJob(userId, {
    title,
    sourceType: "UPLOAD",
    storageKey: url,
  });

  return NextResponse.json(video, { status: 201 });
}
