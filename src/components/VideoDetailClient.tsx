"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, Download, FileText, Loader2, RotateCcw } from "lucide-react";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { TranscriptViewer, type TranscriptSegmentData } from "@/components/TranscriptViewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ACTIVE_STATUSES = new Set(["PENDING", "DOWNLOADING", "PROCESSING"]);
const POLL_INTERVAL_MS = 3000;

function formatMinutesAgo(lastSavedAt: number | null, nowTick: number) {
  if (!lastSavedAt) return null;
  const minutes = Math.max(0, Math.round((nowTick - lastSavedAt) / 60_000));
  if (minutes === 0) return "Salvo automaticamente agora";
  return `Salvo automaticamente há ${minutes} min`;
}

export function VideoDetailClient({
  videoId,
  initialStatus,
  initialSegments,
  videoSrc,
  initialSummary,
  initialSummaryStatus,
}: {
  videoId: string;
  initialStatus: string;
  initialSegments: TranscriptSegmentData[];
  videoSrc?: string | null;
  initialSummary?: string | null;
  initialSummaryStatus?: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [segments, setSegments] = useState(initialSegments);
  const [retrying, setRetrying] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [summary, setSummary] = useState(initialSummary ?? null);
  const [summaryStatus, setSummaryStatus] = useState(initialSummaryStatus ?? null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handleGenerateSummary() {
    setSummaryStatus("PROCESSING");
    setSummaryError(null);
    const res = await fetch(`/api/videos/${videoId}/summary`, { method: "POST" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSummaryStatus("FAILED");
      setSummaryError(data.error ?? "Falha ao gerar resumo");
      return;
    }

    setSummary(data.summary);
    setSummaryStatus("COMPLETE");
  }

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

  const autosaveLabel = formatMinutesAgo(lastSavedAt, nowTick);

  const toolbar = status === "COMPLETE" && (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGenerateSummary}
        disabled={summaryStatus === "PROCESSING"}
      >
        {summaryStatus === "PROCESSING" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <FileText className="size-3.5" />
        )}
        {summaryStatus === "PROCESSING" ? "Gerando..." : "Gerar Resumo por IA"}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              <Download className="size-3.5" />
              Exportar
              <ChevronDown className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent>
          {(["txt", "docx", "pdf"] as const).map((format) => (
            <DropdownMenuItem
              key={format}
              render={<a href={`/api/videos/${videoId}/export?format=${format}`} />}
            >
              .{format}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="outline"
        size="sm"
        render={<Link href="/dicionario" />}
        nativeButton={false}
      >
        <BookOpen className="size-3.5" />
        Dicionário Jurídico
      </Button>

      {autosaveLabel && (
        <span className="ml-auto text-xs text-muted-foreground">{autosaveLabel}</span>
      )}
    </div>
  );

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
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {toolbar}
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
                className="aspect-video w-full rounded-xl bg-black ring-1 ring-border"
              />
              {videoError && <span className="text-xs text-destructive">Erro no vídeo: {videoError}</span>}
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted ring-1 ring-border">
              <span className="text-sm text-muted-foreground">Sem preview disponível</span>
            </div>
          )}
          {statusRow}
        </div>

        <div className="flex flex-col gap-3">
          {status === "COMPLETE" && summary && (
            <Card className="p-4">
              <p className="whitespace-pre-wrap text-sm text-foreground">{summary}</p>
            </Card>
          )}
          {summaryError && <span className="text-sm text-destructive">{summaryError}</span>}
          <TranscriptViewer
            videoId={videoId}
            segments={segments}
            onSegmentsChange={setSegments}
            activeSegmentId={activeSegmentId}
            onSeek={videoSrc ? seekTo : undefined}
            onSaved={() => setLastSavedAt(Date.now())}
          />
        </div>
      </div>
    </div>
  );
}
