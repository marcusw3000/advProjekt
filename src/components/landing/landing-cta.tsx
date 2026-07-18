import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LandingCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
      <Card className="items-center gap-4 bg-primary p-10 text-center text-primary-foreground md:p-16">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">
          Pronto para digitalizar seu escritório?
        </h2>
        <p className="max-w-xl text-primary-foreground/70">
          Junte-se a milhares de advogados que recuperaram horas do seu dia com LexScript. Comece
          agora sem cartão de crédito.
        </p>
        <Button
          render={<Link href="/signup" />}
          nativeButton={false}
          className="mt-2 bg-white text-primary hover:bg-white/90"
        >
          Iniciar Teste Grátis de 30 Minutos
        </Button>
        <p className="text-xs text-primary-foreground/60">Sem fidelidade. Cancele quando quiser.</p>
      </Card>
    </section>
  );
}
