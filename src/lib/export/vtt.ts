import type { ExportSegment } from "./types";

function formatVttTime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const millis = ms % 1000;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
}

export function toVtt(segments: ExportSegment[]): string {
  const cues = segments
    .map((s) => {
      const timeRange = `${formatVttTime(s.startMs)} --> ${formatVttTime(s.endMs)}`;
      return `${timeRange}\n${s.speakerLabel}: ${s.text}`;
    })
    .join("\n\n");

  return `WEBVTT\n\n${cues}\n`;
}
