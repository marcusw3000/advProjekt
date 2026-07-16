const LABELS: Record<string, string> = {
  PENDING: "Na fila",
  DOWNLOADING: "Baixando...",
  PROCESSING: "Transcrevendo...",
  COMPLETE: "Concluído",
  FAILED: "Falhou",
};

const COLORS: Record<string, string> = {
  PENDING: "bg-zinc-200 text-zinc-700",
  DOWNLOADING: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  COMPLETE: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export function JobStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${COLORS[status] ?? "bg-zinc-200 text-zinc-700"}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
