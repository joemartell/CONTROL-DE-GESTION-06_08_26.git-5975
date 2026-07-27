import * as React from "react";
import { Plus, Eye, Pencil, Printer, Trash2, Loader2, Inbox, Calendar } from "lucide-react";
import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/modal";
import { RecordForm } from "../components/record-form";
import { RecordDetail } from "../components/record-detail";
import { PrintDialog } from "../components/print-dialog";
import { useRecordsByYear, useYears, useDeleteRecord } from "../queries/records";
import { cn } from "@/lib/utils";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function fmtDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v.length <= 10 ? v + "T00:00:00" : v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Index() {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);

  const years = useYears();
  const records = useRecordsByYear(year);
  const del = useDeleteRecord();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [detail, setDetail] = React.useState<any | null>(null);
  const [printing, setPrinting] = React.useState<any | null>(null);
  const [toDelete, setToDelete] = React.useState<any | null>(null);

  const all = records.data ?? [];
  const counts = React.useMemo(() => {
    const c: Record<number, number> = {};
    for (const r of all) c[r.mes] = (c[r.mes] ?? 0) + 1;
    return c;
  }, [all]);
  const monthRecords = all.filter((r) => r.mes === month);

  const yearOptions = React.useMemo(() => {
    const set = new Set<number>([now.getFullYear(), year, ...(years.data ?? [])]);
    return [...set].sort((a, b) => b - a);
  }, [years.data, year, now]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    setFormOpen(true);
  };

  const sidebarExtra = (
    <div>
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
        Meses {year}
      </p>
      {MESES.map((m, i) => {
        const n = i + 1;
        const active = n === month;
        const count = counts[n] ?? 0;
        return (
          <button
            key={m}
            onClick={() => setMonth(n)}
            className={cn(
              "relative mb-0.5 flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-white/10 font-semibold text-white"
                : "text-sidebar-foreground/80 hover:bg-white/5",
            )}
          >
            {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-sidebar-primary" />}
            <span>{m}</span>
            {count > 0 && (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold",
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-white/15 text-white",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <Layout sidebarExtra={sidebarExtra}>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Registros de</p>
            <h1 className="font-display text-4xl font-bold text-wine-900">
              {MESES[month - 1]} <span className="text-accent">{year}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-10 rounded-md border border-input bg-white pl-9 pr-8 text-sm font-medium text-ink outline-none focus:border-primary"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button onClick={openNew} size="lg">
              <Plus className="size-4" /> Agregar
            </Button>
          </div>
        </header>

        {records.isLoading ? (
          <div className="flex items-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Cargando registros…
          </div>
        ) : monthRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
            <Inbox className="mb-3 size-10 text-muted-foreground/50" />
            <p className="font-display text-lg font-semibold text-ink">Sin registros en {MESES[month - 1]}</p>
            <p className="mb-4 text-sm text-muted-foreground">Agrega el primer registro de este mes.</p>
            <Button onClick={openNew}>
              <Plus className="size-4" /> Nuevo registro
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {monthRecords.map((r, idx) => (
              <article
                key={r.id}
                className="animate-rise rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-[10px] font-semibold uppercase">No.</span>
                      <span className="font-display text-lg font-bold leading-none">{r.consecutivo}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold text-wine-900">
                        {r.asunto || "Sin asunto"}
                      </h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {r.ente || "Ente no especificado"}
                        {r.numeroOficioEnte ? ` · Oficio ${r.numeroOficioEnte}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                          Recep. {fmtDate(r.fechaRecepcionOficialia)}
                        </span>
                        {r.tipoSesion && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                            {r.tipoSesion}
                          </span>
                        )}
                        {r.consecutivoFolio && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-wine-900">
                            {r.consecutivoFolio}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <IconBtn title="Ver" onClick={() => setDetail(r)}><Eye className="size-4" /></IconBtn>
                    <IconBtn title="Editar" onClick={() => openEdit(r)}><Pencil className="size-4" /></IconBtn>
                    <IconBtn title="Imprimir" onClick={() => setPrinting(r)}><Printer className="size-4" /></IconBtn>
                    <IconBtn title="Eliminar" danger onClick={() => setToDelete(r)}><Trash2 className="size-4" /></IconBtn>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <RecordForm open={formOpen} onClose={() => setFormOpen(false)} record={editing} />
      <RecordDetail open={!!detail} onClose={() => setDetail(null)} record={detail} />
      <PrintDialog open={!!printing} onClose={() => setPrinting(null)} record={printing} />

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        size="sm"
        title="Eliminar registro"
        footer={
          <>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={del.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={del.isPending}
              onClick={async () => {
                await del.mutateAsync({ id: Number(toDelete.id) });
                setToDelete(null);
              }}
            >
              {del.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          ¿Seguro que deseas eliminar el registro <b className="text-ink">#{toDelete?.consecutivo}</b> —{" "}
          {toDelete?.asunto || "sin asunto"}? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </Layout>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors",
        danger ? "hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive" : "hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}
