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

export function DeleteFolderButton({ folderId, folderName }: { folderId: string; folderName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/folders/${folderId}`, { method: "DELETE" });

    setDeleting(false);

    if (!res.ok) {
      setError("Falha ao apagar pasta");
      return;
    }

    router.push("/pastas");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="destructive" size="sm">
            <Trash2 className="size-3.5" />
            Apagar pasta
          </Button>
        }
      />
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Apagar &quot;{folderName}&quot;?</DialogTitle>
          <DialogDescription>
            Os vídeos dentro dessa pasta não serão apagados — eles só deixam de estar organizados aqui.
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
