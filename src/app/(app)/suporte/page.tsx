"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SuportePage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao enviar ticket");
      return;
    }

    setSubject("");
    setMessage("");
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-8">
      <h1 className="font-heading text-2xl text-foreground">Suporte</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Precisa de ajuda? Abra um ticket que nossa equipe responde por email.
      </p>

      <Card className="mt-6 p-6">
        {sent ? (
          <p className="text-sm text-muted-foreground">
            Ticket enviado! Vamos responder no seu email em breve.{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-medium text-primary hover:underline"
            >
              Abrir outro ticket
            </button>
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                type="text"
                required
                maxLength={200}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                required
                maxLength={5000}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Enviar ticket
            </Button>
          </form>
        )}
      </Card>

      <Card className="mt-4 flex-row items-center gap-4 p-6 ring-border/60">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Mail className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Ou envie um email direto</p>
          <a href="mailto:suporte@lexscript.ai" className="text-sm text-primary hover:underline">
            suporte@lexscript.ai
          </a>
        </div>
      </Card>
    </div>
  );
}
