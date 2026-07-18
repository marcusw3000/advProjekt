import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#tecnologia", label: "Tecnologia" },
  { href: "#seguranca", label: "Segurança" },
  { href: "/precos", label: "Preços" },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm">
            Entrar
          </Button>
          <Button
            render={<Link href="/signup" />}
            nativeButton={false}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Cadastrar
          </Button>
        </div>
      </div>
    </header>
  );
}
