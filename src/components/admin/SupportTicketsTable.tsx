"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  userEmail: string;
};

function TicketRow({ ticket }: { ticket: Ticket }) {
  const [status, setStatus] = useState(ticket.status);
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    const nextStatus = status === "OPEN" ? "CLOSED" : "OPEN";
    const res = await fetch(`/api/admin/support/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setLoading(false);
    if (res.ok) setStatus(nextStatus);
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border px-4 py-3 text-sm last:border-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{ticket.subject}</p>
          <p className="truncate text-xs text-muted-foreground">
            {ticket.userEmail} ·{" "}
            {new Date(ticket.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
        <Button
          type="button"
          size="xs"
          variant={status === "OPEN" ? "outline" : "default"}
          disabled={loading}
          onClick={toggleStatus}
          className={status === "CLOSED" ? "bg-primary text-primary-foreground hover:bg-primary/90" : undefined}
        >
          {loading && <Loader2 className="size-3 animate-spin" />}
          {status === "OPEN" ? "Aberto" : "Fechado"}
        </Button>
      </div>
      <p className="whitespace-pre-wrap text-muted-foreground">{ticket.message}</p>
    </div>
  );
}

export function SupportTicketsTable({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return (
      <Card className="items-center gap-2 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">Nenhum ticket ainda.</p>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      {tickets.map((t) => (
        <TicketRow key={t.id} ticket={t} />
      ))}
    </Card>
  );
}
