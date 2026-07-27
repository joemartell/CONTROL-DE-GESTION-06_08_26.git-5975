import * as React from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Combobox creable: escribe o selecciona. Al escribir muestra sugerencias de
// los valores ya cargados; permite agregar nuevos valores libremente.
export function CreatableCombobox({
  value,
  onChange,
  suggestions,
  placeholder = "Escribe o selecciona…",
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setQuery(value), [value]);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes(q))
    .slice(0, 8);
  const exactExists = suggestions.some((s) => s.toLowerCase() === q);
  const canCreate = q.length > 0 && !exactExists;

  const commit = (v: string) => {
    onChange(v);
    setQuery(v);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-10 w-full rounded-md border border-input bg-white px-3 pr-9 text-sm text-ink shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          tabIndex={-1}
        >
          <ChevronDown className="size-4" />
        </button>
      </div>

      {open && (filtered.length > 0 || canCreate) && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-white py-1 shadow-lg">
          {canCreate && (
            <button
              type="button"
              onClick={() => commit(query.trim())}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary hover:bg-secondary"
            >
              <Plus className="size-4" />
              Agregar «{query.trim()}»
            </button>
          )}
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => commit(s)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink hover:bg-secondary"
            >
              <span>{s}</span>
              {s === value && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Selector Sí/No en formato segmentado; "Sí" habilita un campo contiguo.
export function YesNoSegmented({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-input">
      {["Sí", "No"].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-5 py-2 text-sm font-semibold transition-colors",
            value === opt
              ? opt === "Sí"
                ? "bg-primary text-primary-foreground"
                : "bg-muted-ink/80 text-white"
              : "bg-white text-muted-foreground hover:bg-secondary",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
