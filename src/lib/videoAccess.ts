import { db } from "@/lib/db";

export type VideoAccessRole = "owner" | "editor";

export async function getVideoAccess(videoId: string, userId: string) {
  const video = await db.video.findUnique({ where: { id: videoId } });
  if (!video) return null;
  if (video.userId === userId) return { video, role: "owner" as VideoAccessRole };

  const share = await db.videoShare.findUnique({
    where: { videoId_sharedWithUserId: { videoId, sharedWithUserId: userId } },
  });

  return share ? { video, role: "editor" as VideoAccessRole } : null;
}
