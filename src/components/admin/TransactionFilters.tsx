import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const REASON_LABELS: Record<string, string> = {
  SIGNUP_GRANT: "Bônus de cadastro",
  VIDEO_TRANSCRIPTION: "Transcrição de vídeo",
  PURCHASE: "Compra",
  ADMIN_ADJUSTMENT: "Ajuste manual",
};

export function TransactionFilters({
  basePath,
  defaultValues,
  showEmailFilter = true,
}: {
  basePath: string;
  defaultValues: { email?: string; reason?: string; from?: string; to?: string };
  showEmailFilter?: boolean;
}) {
  return (
    <form method="GET" action={basePath} className="flex flex-wrap items-end gap-3">
      {showEmailFilter && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="text"
            placeholder="Buscar por email"
            defaultValue={defaultValues.email}
            className="w-48"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="reason">
          Motivo
        </label>
        <select
          id="reason"
          name="reason"
          defaultValue={defaultValues.reason ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Todos</option>
          {Object.entries(REASON_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="from">
          De
        </label>
        <Input id="from" name="from" type="date" defaultValue={defaultValues.from} className="w-36" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="to">
          Até
        </label>
        <Input id="to" name="to" type="date" defaultValue={defaultValues.to} className="w-36" />
      </div>

      <Button type="submit" size="sm" variant="outline">
        Filtrar
      </Button>
      {(defaultValues.email || defaultValues.reason || defaultValues.from || defaultValues.to) && (
        <a href={basePath} className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline">
          Limpar filtros
        </a>
      )}
    </form>
  );
}
