import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function downloadAudioFromUrl(url: string): Promise<Buffer> {
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
