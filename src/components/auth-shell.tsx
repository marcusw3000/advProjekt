import { Logo } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";

export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-[oklch(0.606_0.25_292.717/25%)] blur-3xl" />
      <Card className="relative z-10 w-full max-w-sm shadow-2xl shadow-black/40 ring-border/60">
        <CardContent className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <Logo className="text-xl" />
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </div>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
