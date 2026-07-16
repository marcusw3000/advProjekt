"use client";

import { useEffect, useState } from "react";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { TranscriptViewer, type TranscriptSegmentData } from "@/components/TranscriptViewer";

const ACTIVE_STATUSES = new Set(["PENDING", "DOWNLOADING", "PROCESSING"]);
const POLL_INTERVAL_MS = 3000;

export function VideoDetailClient({
  videoId,
  initialStatus,
  initialSegments,
}: {
  videoId: string;
  initialStatus: string;
  initialSegments: TranscriptSegmentData[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [segments, setSegments] = useState(initialSegments);
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    const res = await fetch(`/api/videos/${videoId}/retry`, { method: "POST" });
    setRetrying(false);
    if (res.ok) {
      setStatus("PENDING");
      setErrorMessage(null);
    }
  }

  useEffect(() => {
    if (!ACTIVE_STATUSES.has(status)) return;

    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/videos/${videoId}/status`);
      if (!res.ok || cancelled) return;

      const data = await res.json();
      if (cancelled) return;

      setStatus(data.status);
      setErrorMessage(data.errorMessage ?? null);

      if (data.status === "COMPLETE") {
        const videoRes = await fetch(`/api/videos/${videoId}`);
        if (!videoRes.ok || cancelled) return;
        const video = await videoRes.json();
        setSegments(video.segments ?? []);
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status, videoId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <JobStatusBadge status={status} />
        {errorMessage && <span className="text-sm text-red-600">{errorMessage}</span>}
        {status === "FAILED" && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="rounded border px-2 py-1 text-xs disabled:opacity-50"
          >
            {retrying ? "Reenviando..." : "Tentar novamente"}
          </button>
        )}
      </div>
      {status === "COMPLETE" && (
        <div className="flex gap-3 text-sm">
          {(["txt", "srt", "vtt"] as const).map((format) => (
            <a
              key={format}
              href={`/api/videos/${videoId}/export?format=${format}`}
              className="underline"
            >
              Exportar .{format}
            </a>
          ))}
        </div>
      )}
      <TranscriptViewer videoId={videoId} segments={segments} onSegmentsChange={setSegments} />
    </div>
  );
}
