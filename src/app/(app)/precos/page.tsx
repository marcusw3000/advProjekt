import { redirect } from "next/navigation";
import { Check, ShieldCheck, Lock, FileCheck2, ClipboardCheck, TrendingDown } from "lucide-react";
import { auth } from "@/lib/auth";
import { getMinutesBalance } from "@/lib/minutes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Créditos Avulsos",
    description: "Para necessidades pontuais.",
    price: "R$15,00",
    period: "/hora",
    highlight: false,
    included: null,
    features: ["Sem validade de expiração", "Exportação em PDF/DOCX", "Identificação de locutores"],
    cta: "Recarregar Agora",
  },
  {
    name: "Plano Básico",
    description: "Autônomos e pequenos escritórios.",
    price: "R$49,90",
    period: "/mês",
    highlight: false,
    included: "5 horas inclusas",
    features: ["Armazenamento por 12 meses", "Suporte via E-mail", "Dicionário Jurídico Básico"],
    cta: "Assinar Básico",
  },
  {
    name: "Plano Pro",
    description: "Escritórios de alta demanda.",
    price: "R$149,90",
    period: "/mês",
    highlight: true,
    included: "20 horas inclusas",
    features: [
      "Horas extras com 20% de desconto",
      "Gestão de Pastas e Compartilhamento",
      "Prioridade no Processamento",
      "Selos de Autenticidade Digital",
    ],
    cta: "Assinar Pro",
  },
];

const VIDEO_PACKAGES = [
  {
    name: "Vídeo Curto",
    price: "R$9,90",
    description: "Até 30 minutos de áudio ou vídeo. Ideal para audiências curtas ou depoimentos.",
  },
  {
    name: "Vídeo Médio",
    price: "R$19,90",
    description: "Até 120 minutos (2 horas). Perfeito para sessões de julgamento ou reuniões.",
  },
  {
    name: "Vídeo Longo",
    price: "R$49,90",
    description: "Até 300 minutos (5 horas). Projetado para eventos extensos ou processos complexos.",
  },
];

const SECURITY_BADGES = [
  { icon: ShieldCheck, label: "LGPD Compliant" },
  { icon: Lock, label: "AES-256 Encrypted" },
  { icon: FileCheck2, label: "ISO 27001 Ready" },
  { icon: ClipboardCheck, label: "Auditoria Privada" },
];

export default async function PrecosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const minutesBalance = await getMinutesBalance(session.user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <div className="mx-auto mb-8 flex max-w-xl flex-col items-center gap-3 text-center">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Alta Performance Jurídica
        </span>
        <h1 className="font-heading text-4xl font-bold text-foreground">Investimento em Precisão</h1>
        <p className="text-muted-foreground">
          Transcrição jurídica automatizada com segurança de nível bancário e conformidade LGPD
          integral.
        </p>
        <p className="text-sm text-muted-foreground">Saldo atual: {minutesBalance} min</p>
      </div>

      <Card className="mb-10 flex-row items-center justify-between gap-4 bg-primary p-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <TrendingDown className="size-6" />
          <div>
            <p className="font-semibold">Economia Inteligente</p>
            <p className="text-sm text-primary-foreground/70">
              Reduza custos operacionais drasticamente com nossa IA.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-heading text-3xl font-bold">90%</p>
          <p className="text-xs text-primary-foreground/70">de economia vs. transcrição humana</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn("relative gap-0 p-6", plan.highlight && "ring-2 ring-primary md:-translate-y-2")}
          >
            {plan.highlight && (
              <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                Mais Popular
              </span>
            )}
            <h3 className="font-heading text-lg font-semibold text-foreground">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-heading text-3xl font-bold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            {plan.included && (
              <div className="mt-4 rounded-lg bg-secondary px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-foreground">
                {plan.included}
              </div>
            )}
            <ul className="mt-4 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              disabled
              className={cn(
                "mt-6 w-full",
                plan.highlight
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-foreground"
              )}
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground">Pacotes por Vídeo</h2>
        <p className="mt-1 text-muted-foreground">
          Precisa apenas de um arquivo específico? Escolha o tamanho ideal.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {VIDEO_PACKAGES.map((pkg) => (
          <Card key={pkg.name} className="gap-2 p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-heading text-base font-semibold text-foreground">{pkg.name}</h3>
              <span className="font-heading text-lg font-bold text-foreground">{pkg.price}</span>
            </div>
            <p className="text-sm text-muted-foreground">{pkg.description}</p>
            <Button disabled variant="outline" size="sm" className="mt-2 w-fit">
              Comprar Agora
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center gap-6 rounded-2xl bg-secondary/60 py-10 text-center">
        <p className="font-semibold text-foreground">Segurança de Nível Jurídico</p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {SECURITY_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
              <Icon className="size-5 text-foreground" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
