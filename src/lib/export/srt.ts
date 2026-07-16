import type { ExportSegment } from "./types";

function formatSrtTime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const millis = ms % 1000;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")},${millis.toString().padStart(3, "0")}`;
}

export function toSrt(segments: ExportSegment[]): string {
  return segments
    .map((s, index) => {
      const cueNumber = index + 1;
      const timeRange = `${formatSrtTime(s.startMs)} --> ${formatSrtTime(s.endMs)}`;
      return `${cueNumber}\n${timeRange}\n${s.speakerLabel}: ${s.text}\n`;
    })
    .join("\n");
}
