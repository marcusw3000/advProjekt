"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

export function DeleteVideoButton({
  videoId,
  videoTitle,
  compact = false,
}: {
  videoId: string;
  videoTitle: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });

    setDeleting(false);

    if (!res.ok) {
      setError("Falha ao apagar vídeo");
      return;
    }

    router.push("/videos");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          compact ? (
            <button
              type="button"
              aria-label={`Apagar ${videoTitle}`}
              className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:size-8"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <Button type="button" variant="destructive" size="sm">
              <Trash2 className="size-3.5" />
              Apagar
            </Button>
          )
        }
      />
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Apagar &quot;{videoTitle}&quot;?</DialogTitle>
          <DialogDescription>
            O vídeo, a transcrição e o resumo serão apagados permanentemente. Essa ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            }
          />
          <Button type="button" variant="destructive" disabled={deleting} onClick={handleDelete}>
            {deleting && <Loader2 className="size-4 animate-spin" />}
            Apagar
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
