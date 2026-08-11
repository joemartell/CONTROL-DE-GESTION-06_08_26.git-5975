import * as React from "react";
import { Link, useLocation } from "wouter";
import { FileSpreadsheet, FileStack, FileText, HelpCircle, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Registros", icon: FileStack },
  { to: "/plantillas", label: "Plantillas", icon: FileText },
  { to: "/informe", label: "Informe", icon: FileSpreadsheet },
  { to: "/ayuda", label: "Ayuda", icon: HelpCircle },
];

export function Layout({
  children,
  sidebarExtra,
}: {
  children: React.ReactNode;
  sidebarExtra?: React.ReactNode;
}) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-ink">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <div className="flex size-10 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Landmark className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-none">Registros SCG</p>
            <p className="mt-1 text-xs text-sidebar-foreground/70">Oficialía de Partes</p>
          </div>
        </div>

        <nav className="px-3 py-4">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {sidebarExtra && (
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-sidebar-border px-3 py-4">
            {sidebarExtra}
          </div>
        )}

        <div className="border-t border-sidebar-border px-5 py-3 text-[11px] text-sidebar-foreground/60">
          Uso local · Base de datos en tu equipo
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
