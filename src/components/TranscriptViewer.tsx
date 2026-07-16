"use client";

import { useState } from "react";
import { formatMs } from "@/lib/time";

export type TranscriptSegmentData = {
  id: string;
  speakerLabel: string;
  originalSpeakerLabel: string;
  startMs: number;
  endMs: number;
  text: string;
};

export function TranscriptViewer({
  videoId,
  segments,
  onSegmentsChange,
}: {
  videoId: string;
  segments: TranscriptSegmentData[];
  onSegmentsChange: (segments: TranscriptSegmentData[]) => void;
}) {
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  async function renameSpeaker(originalSpeakerLabel: string, newLabel: string) {
    if (!newLabel.trim()) {
      setEditingSpeaker(null);
      return;
    }

    onSegmentsChange(
      segments.map((s) =>
        s.originalSpeakerLabel === originalSpeakerLabel ? { ...s, speakerLabel: newLabel.trim() } : s
      )
    );
    setEditingSpeaker(null);

    await fetch(`/api/videos/${videoId}/speakers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalSpeakerLabel, newLabel: newLabel.trim() }),
    });
  }

  async function editText(segmentId: string, text: string) {
    onSegmentsChange(segments.map((s) => (s.id === segmentId ? { ...s, text } : s)));
    setEditingSegmentId(null);

    await fetch(`/api/segments/${segmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  }

  if (segments.length === 0) {
    return <p className="text-zinc-500 text-sm">Nenhum segmento de transcrição ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {segments.map((segment) => (
        <li key={segment.id} className="flex gap-3 rounded border px-3 py-2">
          <span className="w-28 shrink-0 font-mono text-xs text-zinc-500">
            {formatMs(segment.startMs)}–{formatMs(segment.endMs)}
          </span>
          <div className="flex-1">
            {editingSpeaker === segment.originalSpeakerLabel ? (
              <input
                autoFocus
                defaultValue={segment.speakerLabel}
                onBlur={(e) => renameSpeaker(segment.originalSpeakerLabel, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setEditingSpeaker(null);
                }}
                className="rounded border px-1 text-xs font-semibold"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingSpeaker(segment.originalSpeakerLabel)}
                className="text-xs font-semibold text-zinc-700 hover:underline"
              >
                {segment.speakerLabel}
              </button>
            )}

            {editingSegmentId === segment.id ? (
              <textarea
                autoFocus
                defaultValue={segment.text}
                onBlur={(e) => editText(segment.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingSegmentId(null);
                }}
                className="mt-1 w-full rounded border px-2 py-1"
              />
            ) : (
              <p
                onClick={() => setEditingSegmentId(segment.id)}
                className="cursor-text"
              >
                {segment.text}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
