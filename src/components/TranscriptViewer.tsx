"use client";

import { useMemo, useRef, useState } from "react";
import { Pencil, Search, StickyNote, X } from "lucide-react";
import { formatMs } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text: string, term: string) {
  if (!term.trim()) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={i} className="rounded-sm bg-accent text-inherit">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export type TranscriptSegmentData = {
  id: string;
  speakerLabel: string;
  originalSpeakerLabel: string;
  startMs: number;
  endMs: number;
  text: string;
  notes: string | null;
};

const SPEAKER_COLORS = [
  { bg: "oklch(0.7 0.15 30)", fg: "oklch(0.2 0 0)" },
  { bg: "oklch(0.7 0.15 90)", fg: "oklch(0.2 0 0)" },
  { bg: "oklch(0.7 0.15 150)", fg: "oklch(0.2 0 0)" },
  { bg: "oklch(0.7 0.15 210)", fg: "oklch(0.2 0 0)" },
  { bg: "oklch(0.7 0.15 270)", fg: "oklch(0.2 0 0)" },
  { bg: "oklch(0.7 0.15 330)", fg: "oklch(0.2 0 0)" },
  { bg: "oklch(0.7 0.15 60)", fg: "oklch(0.2 0 0)" },
  { bg: "oklch(0.7 0.15 180)", fg: "oklch(0.2 0 0)" },
];

export function TranscriptViewer({
  videoId,
  segments,
  onSegmentsChange,
  activeSegmentId,
  onSeek,
  onSaved,
}: {
  videoId: string;
  segments: TranscriptSegmentData[];
  onSegmentsChange: (segments: TranscriptSegmentData[]) => void;
  activeSegmentId?: string | null;
  onSeek?: (startMs: number) => void;
  onSaved?: () => void;
}) {
  const [editingFilterSpeaker, setEditingFilterSpeaker] = useState<string | null>(null);
  const [editingSegmentSpeakerId, setEditingSegmentSpeakerId] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [renameMode, setRenameMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [jumpedSegmentId, setJumpedSegmentId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const jumpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speakers = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of segments) {
      if (!seen.has(s.originalSpeakerLabel)) seen.set(s.originalSpeakerLabel, s.speakerLabel);
    }
    return Array.from(seen.entries()).map(([originalSpeakerLabel, speakerLabel]) => ({
      originalSpeakerLabel,
      speakerLabel,
    }));
  }, [segments]);

  const notedSegments = useMemo(() => segments.filter((s) => s.notes?.trim()), [segments]);

  const speakerColorMap = useMemo(() => {
    const map = new Map<string, (typeof SPEAKER_COLORS)[number]>();
    speakers.forEach((sp, i) => map.set(sp.originalSpeakerLabel, SPEAKER_COLORS[i % SPEAKER_COLORS.length]));
    return map;
  }, [speakers]);

  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string> | null>(null);
  const activeSelection = selectedSpeakers ?? new Set(speakers.map((s) => s.originalSpeakerLabel));

  function toggleSpeaker(originalSpeakerLabel: string) {
    const next = new Set(activeSelection);
    if (next.has(originalSpeakerLabel)) next.delete(originalSpeakerLabel);
    else next.add(originalSpeakerLabel);
    setSelectedSpeakers(next);
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSegments = segments.filter(
    (s) =>
      activeSelection.has(s.originalSpeakerLabel) &&
      (!normalizedSearch || s.text.toLowerCase().includes(normalizedSearch))
  );

  async function renameSpeaker(originalSpeakerLabel: string, newLabel: string) {
    if (!newLabel.trim()) {
      setEditingFilterSpeaker(null);
      setEditingSegmentSpeakerId(null);
      return;
    }

    onSegmentsChange(
      segments.map((s) =>
        s.originalSpeakerLabel === originalSpeakerLabel ? { ...s, speakerLabel: newLabel.trim() } : s
      )
    );
    setEditingFilterSpeaker(null);
    setEditingSegmentSpeakerId(null);

    await fetch(`/api/videos/${videoId}/speakers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalSpeakerLabel, newLabel: newLabel.trim() }),
    });
    onSaved?.();
  }

  async function editText(segmentId: string, text: string) {
    onSegmentsChange(segments.map((s) => (s.id === segmentId ? { ...s, text } : s)));
    setEditingSegmentId(null);

    await fetch(`/api/segments/${segmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    onSaved?.();
  }

  async function saveNote(segmentId: string, notes: string) {
    const trimmed = notes.trim();
    const value = trimmed || null;
    onSegmentsChange(segments.map((s) => (s.id === segmentId ? { ...s, notes: value } : s)));
    setEditingNoteId(null);

    await fetch(`/api/segments/${segmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: value }),
    });
    onSaved?.();
  }

  function goToSegment(segment: TranscriptSegmentData) {
    onSeek?.(segment.startMs);
    setSearchTerm("");
    setSelectedSpeakers(null);

    requestAnimationFrame(() => {
      const el = containerRef.current?.querySelector<HTMLElement>(
        `[data-segment-id="${segment.id}"]`
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
    setJumpedSegmentId(segment.id);
    jumpTimeoutRef.current = setTimeout(() => setJumpedSegmentId(null), 2000);
  }

  if (segments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum segmento de transcrição ainda.</p>;
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar na transcrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 pr-8"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {normalizedSearch && (
        <p className="text-xs text-muted-foreground">
          {filteredSegments.length} {filteredSegments.length === 1 ? "resultado" : "resultados"} pra &quot;{searchTerm}&quot;
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedSpeakers(null)}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Todos
        </button>
        {speakers.map((sp) => {
          const color = speakerColorMap.get(sp.originalSpeakerLabel)!;
          const active = activeSelection.has(sp.originalSpeakerLabel);

          if (editingFilterSpeaker === sp.originalSpeakerLabel) {
            return (
              <Input
                key={sp.originalSpeakerLabel}
                autoFocus
                defaultValue={sp.speakerLabel}
                onBlur={(e) => renameSpeaker(sp.originalSpeakerLabel, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setEditingFilterSpeaker(null);
                }}
                className="h-6 w-24 text-xs font-semibold"
              />
            );
          }

          return (
            <button
              key={sp.originalSpeakerLabel}
              type="button"
              onClick={() =>
                renameMode ? setEditingFilterSpeaker(sp.originalSpeakerLabel) : toggleSpeaker(sp.originalSpeakerLabel)
              }
            >
              <Badge
                variant="outline"
                className="cursor-pointer"
                style={{
                  backgroundColor: active ? color.bg : "transparent",
                  color: active ? color.fg : undefined,
                  borderColor: color.bg,
                  opacity: active ? 1 : 0.5,
                }}
              >
                {sp.speakerLabel}
                {renameMode && <Pencil className="size-3" />}
              </Badge>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5">
          {notedSegments.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button type="button" variant="outline" size="xs">
                    <StickyNote className="size-3.5" />
                    Notas ({notedSegments.length})
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="max-w-80">
                {notedSegments.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => goToSegment(s)}
                    className="flex-col items-start gap-0.5"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatMs(s.startMs)} · {s.speakerLabel}
                    </span>
                    <span className="line-clamp-2 text-xs">{s.notes}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            type="button"
            variant={renameMode ? "secondary" : "outline"}
            size="xs"
            onClick={() => setRenameMode((v) => !v)}
          >
            <Pencil className="size-3.5" />
            {renameMode ? "Concluir" : "Editar nomes"}
          </Button>
        </div>
      </div>
      {renameMode && (
        <p className="text-xs text-muted-foreground">Clique em um locutor acima pra renomear.</p>
      )}

      {filteredSegments.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma fala encontrada.</p>
      )}

      {filteredSegments.map((segment) => {
        const color = speakerColorMap.get(segment.originalSpeakerLabel)!;
        return (
        <Card
          key={segment.id}
          data-segment-id={segment.id}
          onClick={() => onSeek?.(segment.startMs)}
          style={{ borderLeft: `3px solid ${color.bg}` }}
          className={`flex-row gap-3 px-3 py-2.5 ring-border/60 transition-colors ${
            onSeek ? "cursor-pointer" : ""
          } ${activeSegmentId === segment.id ? "bg-accent/60 ring-primary/40" : ""} ${
            jumpedSegmentId === segment.id ? "ring-2 ring-primary" : ""
          }`}
        >
          <span className="w-24 shrink-0 pt-0.5 font-mono text-xs text-muted-foreground">
            {formatMs(segment.startMs)}–{formatMs(segment.endMs)}
          </span>
          <div className="flex-1">
            {editingSegmentSpeakerId === segment.id ? (
              <Input
                autoFocus
                defaultValue={segment.speakerLabel}
                onBlur={(e) => renameSpeaker(segment.originalSpeakerLabel, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setEditingSegmentSpeakerId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-6 w-fit text-xs font-semibold"
              />
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSegmentSpeakerId(segment.id);
                }}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: color.bg, color: color.fg, borderColor: color.bg }}
                >
                  {segment.speakerLabel}
                </Badge>
              </button>
            )}

            {editingSegmentId === segment.id ? (
              <Textarea
                autoFocus
                defaultValue={segment.text}
                onBlur={(e) => editText(segment.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingSegmentId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="mt-1.5"
              />
            ) : (
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSegmentId(segment.id);
                }}
                className="mt-1.5 cursor-text"
              >
                {highlightMatch(segment.text, normalizedSearch)}
              </p>
            )}

            {editingNoteId === segment.id ? (
              <Textarea
                autoFocus
                defaultValue={segment.notes ?? ""}
                placeholder="Adicionar nota..."
                onBlur={(e) => saveNote(segment.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingNoteId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="mt-1.5"
              />
            ) : segment.notes ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingNoteId(segment.id);
                }}
                className="mt-1.5 flex items-start gap-1.5 rounded-md bg-accent/40 px-2 py-1 text-left text-xs italic text-muted-foreground hover:bg-accent/60"
              >
                <StickyNote className="mt-0.5 size-3 shrink-0" />
                <span>{segment.notes}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingNoteId(segment.id);
                }}
                className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <StickyNote className="size-3" />
                Nota
              </button>
            )}
          </div>
        </Card>
        );
      })}
    </div>
  );
}
