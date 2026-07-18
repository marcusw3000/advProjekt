import { Folder } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function PastasPage() {
  return (
    <ComingSoon
      title="Minhas Pastas"
      description="Organize suas transcrições em pastas por processo ou cliente."
      icon={Folder}
    />
  );
}
