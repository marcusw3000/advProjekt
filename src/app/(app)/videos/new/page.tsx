"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Link2, Loader2, Timer, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

type Mode = "upload" | "url";

function readMediaDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const el = document.createElement(file.type.startsWith("audio/") ? "audio" : "video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(el.src);
      resolve(Number.isFinite(el.duration) ? el.duration : null);
    };
    el.onerror = () => resolve(null);
    el.src = URL.createObjectURL(file);
  });
}

type FolderOption = { id: string; name: string };

export default function NewVideoPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("upload");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [folderId, setFolderId] = useState("");
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [minutesBalance, setMinutesBalance] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetch("/api/minutes")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMinutesBalance(data?.minutesBalance ?? 0));
    fetch("/api/folders")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setFolders(Array.isArray(data) ? data : []));
  }, []);

  const estimatedMinutes = durationSeconds ? Math.max(1, Math.ceil(durationSeconds / 60)) : null;
  const insufficientBalance =
    minutesBalance !== null &&
    (estimatedMinutes ? minutesBalance < estimatedMinutes : minutesBalance <= 0);

  async function handleFileChange(selected: File | null) {
    setFile(selected);
    setDurationSeconds(null);
    if (selected) {
      const duration = await readMediaDuration(selected);
      setDurationSeconds(duration);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "upload" && !file) {
      setError("Selecione um arquivo de vídeo");
      return;
    }
    if (mode === "url" && !sourceUrl.trim()) {
      setError("Informe um link de vídeo");
      return;
    }

    setConfirmOpen(true);
  }

  async function handleConfirmedSubmit() {
    setConfirmOpen(false);
    setError(null);

    let res: Response;

    if (mode === "upload") {
      if (!file) {
        setError("Selecione um arquivo de vídeo");
        return;
      }

      setLoading(true);

      try {
        const uploadReqRes = await fetch("/api/videos/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            fileSize: file.size,
          }),
        });
        if (!uploadReqRes.ok) {
          const data = await uploadReqRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Falha ao preparar envio");
        }
        const { uploadUrl, publicUrl, contentType, fileSize } = await uploadReqRes.json();

        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!putRes.ok) throw new Error("Falha ao enviar arquivo");

        res = await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storageUrl: publicUrl,
            mimeType: contentType,
            fileSizeBytes: fileSize,
            title: title.trim() || undefined,
            estimatedDurationSeconds: durationSeconds ?? undefined,
            folderId: folderId || undefined,
          }),
        });
      } catch {
        setLoading(false);
        setError("Falha ao enviar vídeo");
        return;
      }
    } else {
      if (!sourceUrl.trim()) {
        setError("Informe um link de vídeo");
        return;
      }

      setLoading(true);
      res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: sourceUrl.trim(),
          title: title.trim() || undefined,
          folderId: folderId || undefined,
        }),
      });
    }

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) setMinutesBalance(0);
      setError(data.error ?? "Falha ao enviar vídeo");
      return;
    }

    const video = await res.json();
    router.push(`/videos/${video.id}`);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8 md:px-8 md:py-10">
      <Link
        href="/videos"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h1 className="font-heading text-xl text-foreground">Novo Arquivo</h1>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="size-3.5" />
            {estimatedMinutes
              ? `Custo estimado: ${estimatedMinutes} min.`
              : "O custo é calculado pela duração real do áudio/vídeo (1 minuto = 1 min de saldo)."}
          </div>

          {insufficientBalance && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              Você não tem minutos suficientes.{" "}
              <Link href="/precos" className="font-medium underline underline-offset-2">
                Comprar minutos
              </Link>
            </div>
          )}

          <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
            <TabsList className="w-full">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">Link</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                type="text"
                placeholder="Ex: Audiência de Conciliação"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {folders.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="folder">Pasta (opcional)</Label>
                <select
                  id="folder"
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Sem pasta</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === "upload" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="file">Arquivo</Label>
                <label
                  htmlFor="file"
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-input px-4 py-8 text-center transition-colors hover:border-primary hover:bg-accent/30"
                >
                  <UploadCloud className="size-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : "Clique para selecionar um vídeo ou áudio"}
                  </span>
                  <input
                    id="file"
                    type="file"
                    accept="video/*,audio/*"
                    required
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sourceUrl">Link do vídeo</Label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="sourceUrl"
                    type="url"
                    placeholder="https://..."
                    required
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading || insufficientBalance}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Confirmar envio</DialogTitle>
            <DialogDescription>
              {mode === "upload" ? file?.name : sourceUrl}
            </DialogDescription>
          </DialogHeader>

          {estimatedMinutes ? (
            <p className="text-sm text-foreground">
              Este processo usará aproximadamente{" "}
              <span className="font-medium">{estimatedMinutes} min</span> do
              seu saldo de{" "}
              <span className="font-medium">{minutesBalance ?? 0} min</span>.
            </p>
          ) : (
            <p className="text-sm text-foreground">
              O custo será calculado pela duração real do vídeo (1 minuto = 1
              min de saldo).
            </p>
          )}

          {insufficientBalance && (
            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              Você não tem minutos suficientes.{" "}
              <Link href="/precos" className="font-medium underline underline-offset-2">
                Comprar minutos
              </Link>
            </div>
          )}

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              }
            />
            <Button
              type="button"
              disabled={insufficientBalance}
              onClick={handleConfirmedSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirmar envio
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
