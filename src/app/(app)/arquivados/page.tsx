import { Archive } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function ArquivadosPage() {
  return (
    <ComingSoon
      title="Arquivados"
      description="Transcrições arquivadas ficam aqui, fora da lista principal."
      icon={Archive}
    />
  );
}
