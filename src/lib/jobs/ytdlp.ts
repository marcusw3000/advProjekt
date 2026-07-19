import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { lookup } from "node:dns/promises";

const execFileAsync = promisify(execFile);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80") ||
    normalized.startsWith("::ffff:") // mapped IPv4 — re-checked by caller via lookup results
  );
}

async function assertPublicHost(url: string): Promise<void> {
  const { hostname } = new URL(url);
  const results = await lookup(hostname, { all: true });
  if (results.length === 0) {
    throw new Error("Could not resolve host");
  }
  for (const { address, family } of results) {
    const isPrivate = family === 4 ? isPrivateIPv4(address) : isPrivateIPv6(address);
    if (isPrivate) {
      throw new Error("URL resolves to a non-public address");
    }
  }
}

export async function downloadAudioFromUrl(url: string): Promise<Buffer> {
  await assertPublicHost(url);

  const dir = await mkdtemp(join(tmpdir(), "advprojekt-ytdlp-"));
  const outputTemplate = join(dir, "audio.%(ext)s");

  try {
    await execFileAsync("yt-dlp", [
      "-x",
      "--audio-format",
      "mp3",
      "--no-playlist",
      "-o",
      outputTemplate,
      url,
    ]);

    const filePath = join(dir, "audio.mp3");
    return await readFile(filePath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
