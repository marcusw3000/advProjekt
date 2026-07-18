import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function ConfiguracoesPage() {
  return (
    <ComingSoon
      title="Configurações"
      description="Preferências de conta, notificações e integrações."
      icon={Settings}
    />
  );
}
