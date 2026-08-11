import * as React from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Combobox creable: escribe o selecciona. Al escribir muestra sugerencias de
// los valores ya cargados; permite agregar nuevos valores libremente.
export function CreatableCombobox({
  value,
  onChange,
  suggestions,
  placeholder = "Escribe o selecciona…",
  onDeleteSuggestion,
  nonDeletableSuggestions = [],
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  onDeleteSuggestion?: (value: string) => void | Promise<void>;
  nonDeletableSuggestions?: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const [deleting, setDeleting] = React.useState<string | null>(null);
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
  const protectedValues = new Set(nonDeletableSuggestions.map((s) => s.toLowerCase()));

  const commit = (v: string) => {
    onChange(v);
    setQuery(v);
    setOpen(false);
  };

  const removeSuggestion = async (suggestion: string) => {
    if (!onDeleteSuggestion || protectedValues.has(suggestion.toLowerCase())) return;
    setDeleting(suggestion);
    try {
      await onDeleteSuggestion(suggestion);
    } finally {
      setDeleting(null);
    }
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
          {filtered.map((s) => {
            const deletable = !!onDeleteSuggestion && !protectedValues.has(s.toLowerCase());
            return (
              <div key={s} className="flex items-center hover:bg-secondary">
                <button
                  type="button"
                  onClick={() => commit(s)}
                  className="flex min-w-0 flex-1 items-center justify-between px-3 py-2 text-left text-sm text-ink"
                >
                  <span className="truncate">{s}</span>
                  {s === value && <Check className="ml-2 size-4 shrink-0 text-primary" />}
                </button>
                {deletable && (
                  <button
                    type="button"
                    title={`Eliminar opción ${s}`}
                    aria-label={`Eliminar opción ${s}`}
                    disabled={deleting === s}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      void removeSuggestion(s);
                    }}
                    className="mr-1 flex size-8 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            );
          })}
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
