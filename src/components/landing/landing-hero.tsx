import Link from "next/link";
import { ArrowRight, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent/40 to-background">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8 md:py-24">
        <div>
          <h1 className="font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl">
            Transcrição Jurídica com IA de Alta Precisão.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Transforme audiências e depoimentos em texto em minutos. Redução de custos
            operacionais com conformidade forense absoluta.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              render={<Link href="/signup" />}
              nativeButton={false}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Teste Grátis (30 min)
              <ArrowRight className="size-4" />
            </Button>
            <Button render={<Link href="#tecnologia" />} nativeButton={false} variant="outline">
              Ver Demonstração
            </Button>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-7 rounded-full border-2 border-background bg-secondary"
                />
              ))}
            </div>
            +500 escritórios utilizam LexScript
          </div>
        </div>

        <Card className="gap-0 p-4 shadow-lg">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <FileAudio className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              AUDIENCIA_VARACIVEL_042.mp3
            </span>
          </div>
          <div className="my-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-2/3 rounded-full bg-primary" />
          </div>
          <div className="flex flex-col gap-3 pt-2 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">MAGISTRADO (00:12)</p>
              <p className="mt-0.5 text-foreground">
                &quot;Iniciamos os trabalhos da presente audiência de instrução e julgamento...&quot;
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">ADVOGADO (00:45)</p>
              <p className="mt-0.5 text-foreground">
                &quot;Pela ordem, Excelência. Gostaríamos de requerer a juntada...&quot;
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
