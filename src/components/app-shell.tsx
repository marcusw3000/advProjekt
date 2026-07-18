"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, LayoutDashboard, LifeBuoy, LogOut, Plus, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/videos", label: "Meus vídeos", icon: LayoutDashboard },
  { href: "/creditos", label: "Créditos", icon: Wallet },
  { href: "/suporte", label: "Suporte", icon: LifeBuoy },
];

function isActive(pathname: string, href: string) {
  if (href === "/videos") return pathname === "/videos" || pathname.startsWith("/videos/");
  return pathname.startsWith(href);
}

export function AppShell({
  userEmail,
  credits,
  onSignOut,
  children,
}: {
  userEmail: string;
  credits: number;
  onSignOut: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Logo />
        <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1">
          <Coins className="size-3.5 text-tertiary" />
          <span className="text-xs font-semibold">{credits} Créditos</span>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/40 bg-card py-6 lg:flex">
        <div className="mb-6 px-6">
          <Logo className="text-xl" />
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Transcrição de vídeo com IA
          </p>
        </div>

        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2.5">
          <Coins className="size-4 text-tertiary" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Saldo</span>
            <span className="text-sm font-semibold">{credits} Créditos</span>
          </div>
        </div>

        <div className="mb-4 px-4">
          <Button
            render={<Link href="/videos/new" />}
            nativeButton={false}
            className="w-full bg-gradient-brand text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" />
            Novo upload
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border/40 px-3 pt-4">
          <div className="truncate px-3 pb-2 text-xs text-muted-foreground">{userEmail}</div>
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
          >
            <LogOut className="size-[18px]" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-border/40 bg-card py-2 lg:hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {label === "Meus vídeos" ? "Vídeos" : label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
