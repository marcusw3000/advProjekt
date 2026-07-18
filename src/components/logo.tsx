import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-gradient-brand bg-clip-text text-lg font-semibold tracking-tight text-transparent",
        className
      )}
    >
      Transcreve AI
    </span>
  );
}
