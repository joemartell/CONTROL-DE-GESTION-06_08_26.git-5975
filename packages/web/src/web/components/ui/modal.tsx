import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const width =
    size === "xl"
      ? "max-w-7xl"
      : size === "lg"
        ? "max-w-3xl"
        : size === "sm"
          ? "max-w-md"
          : "max-w-2xl";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "animate-rise my-6 w-full rounded-xl border border-border bg-card shadow-2xl",
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-secondary/60 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-wine-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-border bg-secondary/40 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
