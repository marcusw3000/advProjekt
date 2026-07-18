import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  PENDING: "Na fila",
  DOWNLOADING: "Baixando...",
  PROCESSING: "Transcrevendo...",
  COMPLETE: "Concluído",
  FAILED: "Falhou",
};

const STYLES: Record<string, string> = {
  PENDING: "bg-secondary text-secondary-foreground",
  DOWNLOADING: "bg-primary/15 text-primary",
  PROCESSING: "bg-primary/15 text-primary",
  COMPLETE: "bg-emerald-500/15 text-emerald-400",
  FAILED: "bg-destructive/15 text-destructive",
};

const ACTIVE_STATUSES = new Set(["DOWNLOADING", "PROCESSING"]);

export function JobStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border-transparent", STYLES[status] ?? STYLES.PENDING)}
    >
      {ACTIVE_STATUSES.has(status) && (
        <span className="size-1.5 rounded-full bg-current animate-pulse" />
      )}
      {LABELS[status] ?? status}
    </Badge>
  );
}
