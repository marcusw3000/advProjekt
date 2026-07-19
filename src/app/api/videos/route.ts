import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadVideoBlob } from "@/lib/storage";
import { processTranscriptionJob } from "@/lib/jobs/processJob";
import { checkRateLimit } from "@/lib/rateLimit";

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

async function resolveFolderId(userId: string, folderId: unknown): Promise<string | undefined | null> {
  if (folderId === undefined) return undefined;
  if (typeof folderId !== "string" || !folderId) return null;
  const folder = await db.folder.findUnique({ where: { id: folderId } });
  if (!folder || folder.userId !== userId) return null;
  return folderId;
}

async function createVideoAndStartJob(
  userId: string,
  data: {
    title: string;
    sourceType: "UPLOAD" | "URL";
    storageKey?: string;
    mimeType?: string;
    fileSizeBytes?: number;
    sourceUrl?: string;
    estimatedDurationSeconds?: number;
    folderId?: string;
  }
) {
  const estimatedMinutes = data.estimatedDurationSeconds
    ? Math.max(1, Math.ceil(data.estimatedDurationSeconds / 60))
    : null;

  // Serializable isolation prevents two concurrent requests from both reading
  // a stale balance and both passing the check before either video is created.
  const video = await db.$transaction(
    async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { minutesBalance: true } });
      const minutesBalance = user?.minutesBalance ?? 0;

      if (estimatedMinutes ? minutesBalance < estimatedMinutes : minutesBalance <= 0) {
        throw new InsufficientCreditsError();
      }

      return tx.video.create({
        data: {
          userId,
          title: data.title,
          sourceType: data.sourceType,
          storageKey: data.storageKey,
          mimeType: data.mimeType,
          fileSizeBytes: data.fileSizeBytes ? BigInt(data.fileSizeBytes) : undefined,
          uploadedAt: data.storageKey ? new Date() : undefined,
          sourceUrl: data.sourceUrl,
          folderId: data.folderId,
          durationSeconds: data.estimatedDurationSeconds
            ? Math.round(data.estimatedDurationSeconds)
            : null,
          status: "PENDING",
          job: { create: {} },
        },
        include: { job: true },
      });
    },
    { isolationLevel: "Serializable" }
  );

  if (video.job) void processTranscriptionJob(video.job.id).catch(() => {});

  return video;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(`video-create:${session.user.id}`, 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas, tente novamente em instantes" }, { status: 429 });
  }

  try {
    return await handleCreateVideo(req, session.user.id);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: "Minutos insuficientes" }, { status: 402 });
    }
    throw err;
  }
}

async function handleCreateVideo(req: Request, userId: string) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await req.json();

    const folderId = await resolveFolderId(userId, body.folderId);
    if (folderId === null) {
      return NextResponse.json({ error: "Pasta inválida" }, { status: 400 });
    }

    const storageUrl = typeof body.storageUrl === "string" ? body.storageUrl.trim() : "";
    if (storageUrl) {
      let parsedStorageUrl: URL;
      let r2PublicUrl: URL;
      try {
        parsedStorageUrl = new URL(storageUrl);
        r2PublicUrl = new URL(process.env.R2_PUBLIC_URL ?? "");
      } catch {
        return NextResponse.json({ error: "Invalid storageUrl" }, { status: 400 });
      }
      if (parsedStorageUrl.hostname !== r2PublicUrl.hostname) {
        return NextResponse.json({ error: "Invalid storageUrl" }, { status: 400 });
      }

      const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Vídeo";
      const estimatedDurationSeconds =
        typeof body.estimatedDurationSeconds === "number" && body.estimatedDurationSeconds > 0
          ? body.estimatedDurationSeconds
          : undefined;
      const mimeType = typeof body.mimeType === "string" ? body.mimeType : undefined;
      const fileSizeBytes = typeof body.fileSizeBytes === "number" ? body.fileSizeBytes : undefined;

      const video = await createVideoAndStartJob(userId, {
        title,
        sourceType: "UPLOAD",
        storageKey: storageUrl,
        mimeType,
        fileSizeBytes,
        estimatedDurationSeconds,
        folderId,
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
      folderId,
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
  const key = `videos/${userId}/${randomUUID()}/original-${file.name}`;

  const url = await uploadVideoBlob(key, file);

  const video = await createVideoAndStartJob(userId, {
    title,
    sourceType: "UPLOAD",
    storageKey: url,
    mimeType: file.type || undefined,
    fileSizeBytes: file.size,
  });

  return NextResponse.json(video, { status: 201 });
}
