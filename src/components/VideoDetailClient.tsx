"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, RotateCcw } from "lucide-react";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { TranscriptViewer, type TranscriptSegmentData } from "@/components/TranscriptViewer";
import { Button } from "@/components/ui/button";

const ACTIVE_STATUSES = new Set(["PENDING", "DOWNLOADING", "PROCESSING"]);
const POLL_INTERVAL_MS = 3000;

export function VideoDetailClient({
  videoId,
  initialStatus,
  initialSegments,
  videoSrc,
}: {
  videoId: string;
  initialStatus: string;
  initialSegments: TranscriptSegmentData[];
  videoSrc?: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [segments, setSegments] = useState(initialSegments);
  const [retrying, setRetrying] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  function seekTo(startMs: number) {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = startMs / 1000;
    el.play();
  }

  function handleTimeUpdate() {
    const el = videoRef.current;
    if (!el) return;
    const currentMs = el.currentTime * 1000;
    const current = segments.find((s) => currentMs >= s.startMs && currentMs < s.endMs);
    setActiveSegmentId(current?.id ?? null);
  }

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
        router.refresh();
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status, videoId, router]);

  const statusRow = (
    <div className="flex flex-wrap items-center gap-2">
      <JobStatusBadge status={status} />
      {errorMessage && <span className="text-sm text-destructive">{errorMessage}</span>}
      {status === "FAILED" && (
        <Button type="button" variant="outline" size="sm" onClick={handleRetry} disabled={retrying}>
          {retrying ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
          {retrying ? "Reenviando..." : "Tentar novamente"}
        </Button>
      )}
      {status === "COMPLETE" && (
        <div className="ml-auto flex flex-wrap gap-2">
          {(["txt", "srt", "vtt"] as const).map((format) => (
            <Button
              key={format}
              variant="outline"
              size="sm"
              render={<a href={`/api/videos/${videoId}/export?format=${format}`} />}
              nativeButton={false}
            >
              <Download className="size-3.5" />
              .{format}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-4 lg:sticky lg:top-8">
        {videoSrc ? (
          <div className="flex flex-col gap-1">
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              onTimeUpdate={handleTimeUpdate}
              onError={(e) => {
                const err = e.currentTarget.error;
                const codes: Record<number, string> = {
                  1: "MEDIA_ERR_ABORTED",
                  2: "MEDIA_ERR_NETWORK",
                  3: "MEDIA_ERR_DECODE",
                  4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
                };
                setVideoError(
                  err ? `${codes[err.code] ?? err.code}${err.message ? `: ${err.message}` : ""}` : "Erro desconhecido"
                );
              }}
              className="aspect-video w-full rounded-xl bg-black ring-1 ring-border/60"
            />
            {videoError && <span className="text-xs text-destructive">Erro no vídeo: {videoError}</span>}
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted ring-1 ring-border/60">
            <span className="text-sm text-muted-foreground">Sem preview disponível</span>
          </div>
        )}
        {statusRow}
      </div>

      <div className="flex flex-col gap-3">
        <TranscriptViewer
          videoId={videoId}
          segments={segments}
          onSegmentsChange={setSegments}
          activeSegmentId={activeSegmentId}
          onSeek={videoSrc ? seekTo : undefined}
        />
      </div>
    </div>
  );
}
