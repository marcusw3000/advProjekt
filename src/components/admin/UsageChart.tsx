type DayCount = { day: string; count: number };

const CHART_COLORS = {
  1: "var(--chart-1)",
  2: "var(--chart-2)",
  3: "var(--chart-3)",
} as const;

export function UsageChart({
  title,
  data,
  color,
  unit,
}: {
  title: string;
  data: DayCount[];
  color: 1 | 2 | 3;
  unit: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">últimos {data.length} dias</span>
      </div>
      <div className="flex h-24 items-end gap-[2px]">
        {data.map((d) => {
          const heightPct = Math.max(4, (d.count / max) * 100);
          return (
            <div
              key={d.day}
              className="flex-1 rounded-t-sm"
              style={{ height: `${heightPct}%`, backgroundColor: CHART_COLORS[color] }}
              title={`${new Date(d.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}: ${d.count} ${unit}`}
            />
          );
        })}
      </div>
    </div>
  );
}
