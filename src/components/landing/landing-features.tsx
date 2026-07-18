import { FileCheck2, Gauge, Sparkles, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function LandingFeatures() {
  return (
    <section id="tecnologia" className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground">
          Tecnologia Desenvolvida para o Direito
        </h2>
        <p className="mt-2 text-muted-foreground">
          Otimização máxima para fluxos forenses complexos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-6">
          <Users2 className="size-6 text-foreground" />
          <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
            Diarização Inteligente
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Identificação automática de falantes (Juiz, Testemunha, Advogados) com precisão
            superior a 98%, mesmo em áudios de baixa qualidade.
          </p>
        </Card>

        <Card className="p-6">
          <Sparkles className="size-6 text-foreground" />
          <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
            Resumos Estratégicos
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Nossa IA extrai os pontos cruciais do depoimento, gerando uma síntese jurídica pronta
            para anexar em petições.
          </p>
        </Card>

        <Card className="p-6">
          <FileCheck2 className="size-6 text-foreground" />
          <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
            Formato Forense
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Exportação em PDF, DOCX e TXT seguindo padrões de numeração de linhas e marcação
            temporal exigidos pelos tribunais.
          </p>
        </Card>

        <Card className="gap-2 bg-primary p-6 text-primary-foreground">
          <Gauge className="size-6" />
          <h3 className="mt-1 font-heading text-lg font-semibold">
            Processamento em Tempo Real
          </h3>
          <p className="text-sm text-primary-foreground/70">
            1 hora de audiência transcrita em menos de 5 minutos. Ganhe agilidade em prazos fatais
            com processamento paralelo escalável.
          </p>
        </Card>
      </div>
    </section>
  );
}
