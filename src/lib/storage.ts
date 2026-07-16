import { put, del } from "@vercel/blob";

export async function uploadVideoBlob(key: string, file: File | Buffer) {
  const blob = await put(key, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function deleteVideoBlob(url: string) {
  await del(url);
}
