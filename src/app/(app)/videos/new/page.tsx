"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { ArrowLeft, Coins, Link2, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CREDIT_COST_PER_VIDEO } from "@/lib/creditsConfig";

type Mode = "upload" | "url";

export default function NewVideoPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("upload");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/credits")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCredits(data?.credits ?? 0));
  }, []);

  const insufficientCredits = credits !== null && credits < CREDIT_COST_PER_VIDEO;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let res: Response;

    if (mode === "upload") {
      if (!file) {
        setError("Selecione um arquivo de vídeo");
        return;
      }

      setLoading(true);

      try {
        const blob = await upload(`videos/${Date.now()}-${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/videos/upload",
        });

        res = await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blobUrl: blob.url, title: title.trim() || undefined }),
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
        body: JSON.stringify({ sourceUrl: sourceUrl.trim(), title: title.trim() || undefined }),
      });
    }

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) setCredits(0);
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

      <Card className="ring-border/60">
        <CardContent className="flex flex-col gap-4">
          <h1 className="font-heading text-xl text-foreground">Novo vídeo</h1>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins className="size-3.5 text-tertiary" />
            Esta transcrição custa {CREDIT_COST_PER_VIDEO} créditos.
          </div>

          {insufficientCredits && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              Você não tem créditos suficientes.{" "}
              <Link href="/creditos" className="font-medium underline underline-offset-2">
                Comprar créditos
              </Link>
            </div>
          )}

          <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
            <TabsList className="w-full">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">Link</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                type="text"
                placeholder="Ex: Reunião de kickoff"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

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
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
              disabled={loading || insufficientCredits}
              className="bg-gradient-brand text-primary-foreground hover:opacity-90"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
