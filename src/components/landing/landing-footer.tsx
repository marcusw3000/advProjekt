import Link from "next/link";
import { Logo } from "@/components/logo";

const STATIC_LINKS = ["Termos de Uso", "Privacidade", "Segurança LGPD"];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 md:flex-row md:items-center md:px-8">
        <div>
          <Logo />
          <p className="mt-1 text-xs text-muted-foreground">
            © 2026 LexScript. Processamento Jurídico de Alta Performance.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {STATIC_LINKS.map((label) => (
            <span key={label}>{label}</span>
          ))}
          <Link href="/suporte" className="hover:text-foreground">
            Contato
          </Link>
        </nav>
      </div>
    </footer>
  );
}
