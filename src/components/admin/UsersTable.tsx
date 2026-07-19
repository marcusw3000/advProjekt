"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  minutesBalance: number;
  isAdmin: boolean;
  createdAt: string;
  videoCount: number;
};

function UserRow({ user }: { user: AdminUser }) {
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [balance, setBalance] = useState(String(user.minutesBalance));
  const [adminLoading, setAdminLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleAdmin() {
    setError(null);
    setAdminLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !isAdmin }),
    });
    setAdminLoading(false);

    if (!res.ok) {
      setError("Falha ao atualizar");
      return;
    }
    setIsAdmin(!isAdmin);
  }

  async function saveBalance() {
    setError(null);
    const parsed = Number(balance);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setError("Saldo inválido");
      return;
    }

    setBalanceLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}/minutes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutesBalance: parsed }),
    });
    setBalanceLoading(false);

    if (!res.ok) {
      setError("Falha ao ajustar saldo");
      return;
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_100px_150px_90px_150px] items-center gap-4 border-b border-border px-4 py-3 text-sm last:border-0">
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{user.name ?? "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <span className="text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
      </span>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={0}
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="h-7 w-20 px-2 text-xs"
        />
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={balanceLoading}
          onClick={saveBalance}
        >
          {balanceLoading && <Loader2 className="size-3 animate-spin" />}
          Salvar
        </Button>
      </div>
      <span className="text-center font-mono text-muted-foreground">{user.videoCount}</span>
      <Button
        type="button"
        size="xs"
        variant={isAdmin ? "default" : "outline"}
        disabled={adminLoading}
        onClick={toggleAdmin}
        className={isAdmin ? "bg-primary text-primary-foreground hover:bg-primary/90" : undefined}
      >
        {adminLoading && <Loader2 className="size-3 animate-spin" />}
        {isAdmin ? "É admin" : "Tornar admin"}
      </Button>
      {error && <span className="col-span-5 text-xs text-destructive">{error}</span>}
    </div>
  );
}

export function UsersTable({ users }: { users: AdminUser[] }) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="grid grid-cols-[minmax(0,1fr)_100px_150px_90px_150px] items-center gap-4 border-b border-border bg-secondary/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Usuário</span>
        <span>Cadastro</span>
        <span>Saldo (min)</span>
        <span className="text-center">Vídeos</span>
        <span>Admin</span>
      </div>
      {users.map((u) => (
        <UserRow key={u.id} user={u} />
      ))}
    </Card>
  );
}
