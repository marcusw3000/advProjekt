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
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <Card className="w-full max-w-sm shadow-sm">
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
