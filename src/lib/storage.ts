import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/lib/db";

const R2_BUCKET = process.env.R2_BUCKET ?? "";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

function keyToPublicUrl(key: string) {
  return `${R2_PUBLIC_URL}/${key}`;
}

function publicUrlToKey(urlOrKey: string) {
  if (R2_PUBLIC_URL && urlOrKey.startsWith(R2_PUBLIC_URL)) {
    return urlOrKey.slice(R2_PUBLIC_URL.length + 1);
  }
  return urlOrKey;
}

export async function uploadFile(key: string, body: File | Buffer, contentType?: string) {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(await body.arrayBuffer());
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: bytes,
      ContentType: contentType ?? (body instanceof File ? body.type : undefined),
    })
  );
  return keyToPublicUrl(key);
}

export async function deleteFile(keyOrUrl: string) {
  await s3.send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: publicUrlToKey(keyOrUrl) })
  );
}

export async function generateSignedUploadUrl(key: string, contentType: string, expiresInSeconds = 600) {
  const command = new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  return { url, publicUrl: keyToPublicUrl(key) };
}

export async function generateSignedDownloadUrl(keyOrUrl: string, expiresInSeconds = 900) {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: publicUrlToKey(keyOrUrl) });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function uploadVideoBlob(key: string, file: File | Buffer) {
  return uploadFile(key, file);
}

export async function deleteVideoBlob(keyOrUrl: string) {
  await deleteFile(keyOrUrl);
}

export async function deleteVideoAssets(videoId: string) {
  const video = await db.video.findUnique({ where: { id: videoId }, select: { userId: true } });
  if (!video) return;

  const prefixes = [`videos/${video.userId}/${videoId}/`, `audio/${video.userId}/${videoId}/`];

  for (const Prefix of prefixes) {
    const listed = await s3.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix }));
    for (const obj of listed.Contents ?? []) {
      if (obj.Key) await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: obj.Key }));
    }
  }
}
