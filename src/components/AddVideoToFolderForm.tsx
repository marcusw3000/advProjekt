"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AddVideoToFolderForm({
  folderId,
  availableVideos,
}: {
  folderId: string;
  availableVideos: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [videoId, setVideoId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!videoId) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Falha ao adicionar vídeo");
      return;
    }

    setVideoId("");
    router.refresh();
  }

  if (availableVideos.length === 0) {
    return null;
  }

  return (
    <Card className="flex-row flex-wrap items-center gap-3 p-4">
      <select
        value={videoId}
        disabled={saving}
        onChange={(e) => setVideoId(e.target.value)}
        className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
      >
        <option value="">Selecione um vídeo para adicionar…</option>
        {availableVideos.map((v) => (
          <option key={v.id} value={v.id}>
            {v.title}
          </option>
        ))}
      </select>
      <Button type="button" size="sm" variant="outline" disabled={!videoId || saving} onClick={handleAdd}>
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
        Adicionar
      </Button>
      {error && <span className="w-full text-xs text-destructive">{error}</span>}
    </Card>
  );
}
