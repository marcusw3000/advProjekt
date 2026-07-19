"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowLeft, LayoutGrid, LifeBuoy, LineChart, Users, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Visão Geral", icon: LayoutGrid },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/admin/jobs", label: "Jobs", icon: AlertTriangle },
  { href: "/admin/observabilidade", label: "Observabilidade", icon: LineChart },
  { href: "/admin/suporte", label: "Suporte", icon: LifeBuoy },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-white py-6 lg:flex">
        <div className="mb-6 px-6">
          <Logo className="text-xl" />
          <p className="mt-1 text-xs text-muted-foreground">Admin</p>
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

        <div className="border-t border-border px-3 pt-4">
          <Link
            href="/videos"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="size-[18px]" />
            Voltar ao app
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:hidden">
        <Logo />
        <Link href="/videos" className="text-sm font-medium text-muted-foreground">
          Voltar
        </Link>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
