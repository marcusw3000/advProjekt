import { formatMs } from "@/lib/time";
import type { ExportSegment } from "./types";

export function toTxt(segments: ExportSegment[]): string {
  return segments
    .map((s) => `[${formatMs(s.startMs)}] ${s.speakerLabel}: ${s.text}`)
    .join("\n");
}
