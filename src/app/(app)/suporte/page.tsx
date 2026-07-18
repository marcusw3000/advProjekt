import { Mail } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SuportePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-8">
      <h1 className="font-heading text-2xl text-foreground">Suporte</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Precisa de ajuda? Fale com a gente.
      </p>

      <Card className="mt-6 flex-row items-center gap-4 p-6 ring-border/60">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Mail className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Email</p>
          <a href="mailto:suporte@lexscript.ai" className="text-sm text-primary hover:underline">
            suporte@lexscript.ai
          </a>
        </div>
      </Card>
    </div>
  );
}
