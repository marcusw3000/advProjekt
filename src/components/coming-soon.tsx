import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-8">
      <h1 className="font-heading text-2xl text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <Card className="mt-6 items-center gap-3 p-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-secondary">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">Em breve</p>
        <p className="text-sm text-muted-foreground">Essa área ainda está em construção.</p>
      </Card>
    </div>
  );
}
