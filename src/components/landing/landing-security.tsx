import { Lock, ServerOff, ShieldCheck, EyeOff } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Conformidade", detail: "LGPD Compliant" },
  { icon: EyeOff, title: "Sigilo", detail: "Sem treinamento com seus dados" },
  { icon: Lock, title: "Criptografia", detail: "AES-256 bits" },
  { icon: ServerOff, title: "Local Hosting", detail: "Opção On-Premise" },
];

export function LandingSecurity() {
  return (
    <section id="seguranca" className="bg-secondary/60 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2 md:px-8">
        <div>
          <h2 className="font-heading text-3xl font-bold text-foreground">
            Segurança e Sigilo são Inegociáveis
          </h2>
          <p className="mt-3 text-muted-foreground">
            Seus dados e arquivos são processados em infraestrutura isolada com criptografia
            militar. Garantimos a integridade da cadeia de custódia digital em cada transcrição.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {ITEMS.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex items-start gap-2">
                <Icon className="mt-0.5 size-4 shrink-0 text-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="aspect-video w-full rounded-2xl bg-primary" />
      </div>
    </section>
  );
}
