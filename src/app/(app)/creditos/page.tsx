import { redirect } from "next/navigation";
import { Check, Coins } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCredits, CREDIT_COST_PER_VIDEO } from "@/lib/credits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PACKS = [
  {
    name: "Básico",
    description: "Perfeito para uso ocasional e testes.",
    price: "R$29",
    period: "Pagamento único",
    credits: 30,
    highlight: false,
    features: [
      { label: "Transcrição de alta precisão", included: true },
      { label: "Exportação em TXT e SRT", included: true },
      { label: "Suporte prioritário", included: false },
    ],
    cta: "Comprar Básico",
  },
  {
    name: "Pro",
    description: "Para criadores de conteúdo e profissionais.",
    price: "R$99",
    period: "/mês",
    credits: 150,
    highlight: true,
    features: [
      { label: "Velocidade de processamento 2x mais rápida", included: true },
      { label: "Identificação de múltiplos locutores", included: true },
      { label: "Suporte prioritário via email", included: true },
    ],
    cta: "Assinar Pro",
  },
  {
    name: "Enterprise",
    description: "Soluções em larga escala para equipes.",
    price: "Sob Demanda",
    period: null,
    credits: null,
    highlight: false,
    features: [
      { label: "API de integração direta", included: true },
      { label: "Gerenciamento de equipe e permissões", included: true },
      { label: "Gerente de conta dedicado 24/7", included: true },
    ],
    cta: "Falar com Consultor",
  },
];

export default async function CreditosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const credits = await getCredits(session.user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <div className="mx-auto mb-4 flex max-w-xl flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5">
          <Coins className="size-4 text-tertiary" />
          <span className="text-sm font-semibold">Saldo atual: {credits} créditos</span>
        </div>
        <h1 className="font-heading text-4xl text-primary">Créditos</h1>
        <p className="text-muted-foreground">
          Cada transcrição custa {CREDIT_COST_PER_VIDEO} créditos. Compre um pacote pra continuar
          transcrevendo, ou assine pra economizar.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-3">
        {PACKS.map((pack) => (
          <Card
            key={pack.name}
            className={cn(
              "relative gap-0 p-8 ring-border/60",
              pack.highlight && "ring-primary/40 shadow-[0_0_40px_-12px_var(--primary)] md:-translate-y-4"
            )}
          >
            {pack.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                Mais Popular
              </span>
            )}

            <div className="mb-6">
              <h3 className={cn("font-heading text-xl", pack.highlight ? "text-primary" : "text-foreground")}>
                {pack.name}
              </h3>
              <p className="mt-2 h-10 text-sm text-muted-foreground">{pack.description}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-heading text-4xl">{pack.price}</span>
                {pack.period && <span className="text-sm text-muted-foreground">{pack.period}</span>}
              </div>
            </div>

            <div
              className={cn(
                "mb-6 flex items-center justify-between rounded-xl border px-4 py-3",
                pack.highlight ? "border-primary/20 bg-primary/10" : "border-border/40 bg-background/60"
              )}
            >
              <span className={cn("font-semibold", pack.highlight && "text-primary")}>
                {pack.credits ? `${pack.credits} Créditos` : "Ilimitado"}
              </span>
              <Coins className={cn("size-4", pack.highlight ? "text-primary" : "text-tertiary")} />
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {pack.features.map((f) => (
                <li key={f.label} className="flex items-start gap-2.5 text-sm">
                  <Check
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      f.included ? "text-primary" : "text-muted-foreground/40"
                    )}
                  />
                  <span className={f.included ? "text-foreground" : "text-muted-foreground/40"}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              disabled
              className={cn(
                "w-full",
                pack.highlight
                  ? "bg-gradient-brand text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {pack.cta}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Pagamento em breve</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
