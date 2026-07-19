"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FolderAssignSelect({
  videoId,
  folders,
  currentFolderId,
  className,
}: {
  videoId: string;
  folders: { id: string; name: string }[];
  currentFolderId: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentFolderId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: string) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: next || null }),
    });

    setSaving(false);

    if (!res.ok) {
      setValue(previous);
      setError("Falha ao mover vídeo");
      return;
    }

    router.refresh();
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value)}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
      >
        <option value="">Sem pasta</option>
        {folders.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
      {saving && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
