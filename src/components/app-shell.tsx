"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  Folder,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Plus,
  Settings,
  Share2,
  Timer,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIDEBAR_ITEMS = [
  { href: "/videos", label: "Visão Geral", icon: LayoutGrid },
  { href: "/pastas", label: "Minhas Pastas", icon: Folder },
  { href: "/compartilhados", label: "Compartilhados", icon: Share2 },
  { href: "/arquivados", label: "Arquivados", icon: Archive },
];

const TOP_NAV_ITEMS = [
  { href: "/videos", label: "Dashboard" },
  { href: "/modelos", label: "Modelos" },
  { href: "/precos", label: "Preços" },
];

function isActive(pathname: string, href: string) {
  if (href === "/videos") return pathname === "/videos" || pathname.startsWith("/videos/");
  return pathname.startsWith(href);
}

export function AppShell({
  userEmail,
  minutesBalance,
  onSignOut,
  children,
}: {
  userEmail: string;
  minutesBalance: number;
  onSignOut: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1">
          <Timer className="size-3.5 text-foreground" />
          <span className="text-xs font-semibold">{minutesBalance} min</span>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-white py-6 lg:flex">
        <div className="mb-6 px-6">
          <Logo className="text-xl" />
          <p className="mt-1 text-xs text-muted-foreground">LexScript Pro</p>
        </div>

        {/* Top nav (Dashboard / Modelos / Preços) mirrored here for desktop discoverability */}
        <nav className="mb-4 flex items-center gap-4 px-6 text-sm font-medium">
          {TOP_NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                isActive(pathname, href)
                  ? "text-foreground underline underline-offset-4"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="mb-4 px-4">
          <Button
            render={<Link href="/videos/new" />}
            nativeButton={false}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Novo Arquivo
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {SIDEBAR_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 mb-4 rounded-xl bg-primary p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70">
            Promoção
          </p>
          <p className="mt-1 text-sm font-semibold text-primary-foreground">
            Upgrade para Premium
          </p>
          <Button
            render={<Link href="/precos" />}
            nativeButton={false}
            className="mt-3 w-full bg-white text-primary hover:bg-white/90"
            size="sm"
          >
            Ver Planos
          </Button>
        </div>

        <div className="space-y-1 border-t border-border px-3 pt-4">
          <div className="truncate px-3 pb-2 text-xs text-muted-foreground">{userEmail}</div>
          <Link
            href="/suporte"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <HelpCircle className="size-[18px]" />
            Ajuda
          </Link>
          <Link
            href="/configuracoes"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings className="size-[18px]" />
            Configurações
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="size-[18px]" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-border bg-white py-2 lg:hidden">
        {SIDEBAR_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {label === "Visão Geral" ? "Início" : label}
            </Link>
          );
        })}
        <Link
          href="/precos"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium",
            isActive(pathname, "/precos") ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <Timer className="size-5" />
          Preços
        </Link>
      </nav>
    </div>
  );
}
