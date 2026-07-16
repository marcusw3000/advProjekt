import type { Video } from "@/generated/prisma/client";
import { downloadAudioFromUrl } from "@/lib/jobs/ytdlp";
import { uploadVideoBlob } from "@/lib/storage";

export async function resolveAudioUrl(video: Video): Promise<string> {
  if (video.sourceType === "UPLOAD") {
    if (!video.storageKey) throw new Error("Video has no storageKey");
    return video.storageKey;
  }

  if (!video.sourceUrl) throw new Error("Video has no sourceUrl");

  const audioBuffer = await downloadAudioFromUrl(video.sourceUrl);
  const key = `videos/${video.userId}/${Date.now()}-extracted-audio.mp3`;
  return uploadVideoBlob(key, audioBuffer);
}
