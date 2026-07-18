import { BookOpen } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function DicionarioPage() {
  return (
    <ComingSoon
      title="Dicionário Jurídico"
      description="Termos técnicos identificados nas suas transcrições, com definição rápida."
      icon={BookOpen}
    />
  );
}
