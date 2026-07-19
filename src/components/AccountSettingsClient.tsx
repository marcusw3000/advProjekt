"use client";

import { useState } from "react";
import { Loader2, Receipt, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MinutesReason = "SIGNUP_GRANT" | "VIDEO_TRANSCRIPTION" | "PURCHASE" | "ADMIN_ADJUSTMENT";

type Transaction = {
  id: string;
  amount: number;
  reason: MinutesReason;
  createdAt: string;
};

const REASON_LABELS: Record<MinutesReason, string> = {
  SIGNUP_GRANT: "Bônus de cadastro",
  VIDEO_TRANSCRIPTION: "Transcrição de vídeo",
  PURCHASE: "Compra",
  ADMIN_ADJUSTMENT: "Ajuste manual",
};

export function AccountSettingsClient({
  name: initialName,
  email,
  transactions,
}: {
  name: string;
  email: string;
  transactions: Transaction[];
}) {
  const [name, setName] = useState(initialName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setNameMessage(null);
    setNameLoading(true);

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setNameLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setNameError(data.error ?? "Falha ao salvar nome");
      return;
    }

    setNameMessage("Nome atualizado.");
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }

    setPasswordLoading(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setPasswordLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPasswordError(data.error ?? "Falha ao trocar senha");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Senha atualizada.");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus dados de conta e senha.</p>
      </div>

      <Card className="gap-4 p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserIcon className="size-4" />
          Perfil
        </div>
        <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          {nameMessage && <p className="text-sm text-muted-foreground">{nameMessage}</p>}
          <Button
            type="submit"
            disabled={nameLoading}
            className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {nameLoading && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
        </form>
      </Card>

      <Card className="gap-4 p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          Trocar senha
        </div>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPassword">Senha atual</Label>
            <Input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          {passwordMessage && <p className="text-sm text-muted-foreground">{passwordMessage}</p>}
          <Button
            type="submit"
            disabled={passwordLoading}
            className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {passwordLoading && <Loader2 className="size-4 animate-spin" />}
            Trocar senha
          </Button>
        </form>
      </Card>

      <div>
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Receipt className="size-4" />
          Histórico de créditos
        </div>

        {transactions.length === 0 ? (
          <Card className="items-center gap-3 px-6 py-16 text-center">
            <Receipt className="size-10 text-muted-foreground" />
            <p className="font-medium">Nenhuma transação ainda</p>
          </Card>
        ) : (
          <Card className="gap-0 overflow-hidden p-0">
            <div className="grid grid-cols-[112px_minmax(0,1fr)_84px] items-center gap-4 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Data</span>
              <span>Motivo</span>
              <span className="text-right">Valor</span>
            </div>
            {transactions.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[112px_minmax(0,1fr)_84px] items-center gap-4 border-b border-border px-4 py-3 text-sm last:border-0"
              >
                <span className="text-muted-foreground">
                  {new Date(t.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-foreground">{REASON_LABELS[t.reason]}</span>
                <span
                  className={`text-right font-mono ${t.amount < 0 ? "text-destructive" : "text-primary"}`}
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount} min
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
