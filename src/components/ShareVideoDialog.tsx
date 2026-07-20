"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Share = {
  id: string;
  sharedWith: { id: string; email: string; name: string | null };
};

export function ShareVideoDialog({
  videoId,
  videoTitle,
  initialShares,
}: {
  videoId: string;
  videoTitle: string;
  initialShares: Share[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState(initialShares);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    const trimmed = email.trim();
    if (!trimmed) return;

    setAdding(true);
    setError(null);

    const res = await fetch(`/api/videos/${videoId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });
    const data = await res.json().catch(() => ({}));

    setAdding(false);

    if (!res.ok) {
      setError(data.error ?? "Falha ao compartilhar");
      return;
    }

    setShares((prev) => [data, ...prev.filter((s) => s.id !== data.id)]);
    setEmail("");
    router.refresh();
  }

  async function handleRemove(shareId: string) {
    setRemovingId(shareId);
    setError(null);

    const res = await fetch(`/api/videos/${videoId}/shares/${shareId}`, { method: "DELETE" });

    setRemovingId(null);

    if (!res.ok) {
      setError("Falha ao remover acesso");
      return;
    }

    setShares((prev) => prev.filter((s) => s.id !== shareId));
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <Share2 className="size-3.5" />
            Compartilhar
          </Button>
        }
      />
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Compartilhar &quot;{videoTitle}&quot;</DialogTitle>
          <DialogDescription>
            Convide outro usuário cadastrado pelo email. Ele poderá visualizar e editar a
            transcrição.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            placeholder="email@exemplo.com"
            disabled={adding}
            className="h-9 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          />
          <Button type="button" size="sm" onClick={handleAdd} disabled={adding || !email.trim()}>
            {adding ? <Loader2 className="size-3.5 animate-spin" /> : "Adicionar"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {shares.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {share.sharedWith.name ?? share.sharedWith.email}
                </span>
                <button
                  type="button"
                  aria-label={`Remover acesso de ${share.sharedWith.email}`}
                  onClick={() => handleRemove(share.id)}
                  disabled={removingId === share.id}
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  {removingId === share.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <X className="size-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </DialogPopup>
    </Dialog>
  );
}
