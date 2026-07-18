import { LayoutTemplate } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function ModelosPage() {
  return (
    <ComingSoon
      title="Modelos"
      description="Modelos prontos de petição e resumo pra agilizar seu fluxo jurídico."
      icon={LayoutTemplate}
    />
  );
}
