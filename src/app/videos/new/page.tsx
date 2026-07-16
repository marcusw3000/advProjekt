"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

type Mode = "upload" | "url";

export default function NewVideoPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("upload");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError(data.error ?? "Falha ao enviar vídeo");
      return;
    }

    const video = await res.json();
    router.push(`/videos/${video.id}`);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Novo vídeo</h1>

      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`rounded px-3 py-1 ${mode === "upload" ? "bg-black text-white" : "border"}`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`rounded px-3 py-1 ${mode === "url" ? "bg-black text-white" : "border"}`}
        >
          Link
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Título (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded border px-3 py-2"
        />

        {mode === "upload" ? (
          <input
            type="file"
            accept="video/*,audio/*"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded border px-3 py-2"
          />
        ) : (
          <input
            type="url"
            placeholder="https://..."
            required
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="rounded border px-3 py-2"
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>
      <Link href="/videos" className="text-sm underline">
        Voltar
      </Link>
    </div>
  );
}
