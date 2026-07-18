"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function VideoTitleEditor({
  videoId,
  initialTitle,
  className,
  inputClassName,
}: {
  videoId: string;
  initialTitle: string;
  className?: string;
  inputClassName?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function startEditing(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDraft(title);
    setError(null);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function cancelEditing(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setEditing(false);
    setError(null);
  }

  async function save(e?: React.FormEvent | React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    const res = await fetch(`/api/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    setSaving(false);

    if (!res.ok) {
      setError("Falha ao salvar");
      return;
    }

    setTitle(trimmed);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className={cn("flex items-center gap-1.5", className)}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancelEditing();
          }}
          disabled={saving}
          className={cn(
            "min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring",
            inputClassName
          )}
        />
        <button
          type="submit"
          disabled={saving}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        </button>
        <button
          type="button"
          onClick={cancelEditing}
          disabled={saving}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </form>
    );
  }

  return (
    <div className={cn("group/title flex min-w-0 items-center gap-1.5", className)}>
      <span className="truncate">{title}</span>
      <button
        type="button"
        onClick={startEditing}
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 hover:bg-secondary hover:text-foreground group-hover/title:opacity-100"
        aria-label="Editar nome"
      >
        <Pencil className="size-3.5" />
      </button>
    </div>
  );
}
