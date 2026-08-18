import * as React from "react";
import {
  Plus, Eye, Pencil, Printer, Trash2, Loader2, Inbox, Calendar,
  Users, Download, FolderOpen,
} from "lucide-react";
import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/modal";
import { RecordForm } from "../components/record-form";
import { RecordDetail } from "../components/record-detail";
import { PrintDialog } from "../components/print-dialog";
import { ExcelImportControls } from "../components/excel-import-controls";
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

function fmtLocalDateTime(value: string | null | undefined) {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return value;
  const [, year = "", month = "", day = "", hour = "", minute = ""] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function isPendingExpediente(record: any) {
  return record?.esExpediente === true && record?.expedienteEstado !== "finalizado";
}

async function downloadPendingExcel(records: any[], year: number, month: number) {
  const XLSX = await import("xlsx");
  const sorted = [...records].sort((a, b) =>
    String(a.personaContralora || "Sin persona asignada").localeCompare(
      String(b.personaContralora || "Sin persona asignada"),
      "es",
    ),
  );

  const rows = sorted.map((r) => ({
    "Consecutivo": r.consecutivo ?? "",
    "Persona contralora convocada": r.personaContralora ?? "",
    "Ente": r.ente ?? "",
    "Órgano Colegiado": r.organoColegiado ?? "",
    "Número de oficio ente": r.numeroOficioEnte ?? "",
    "Fecha y hora de sesión": fmtLocalDateTime(r.fechaHoraSesion),
    "Fecha límite del reporte": fmtLocalDateTime(r.reporteFechaLimite),
    "Entrega de reporte de Actividades": r.reporteActividadesEstado === "no entregado" ? "No entregado" : "Pendiente",
    "Vencido": r.reporteVencido ? "Sí" : "No",
    "Folio": r.consecutivoFolio ?? "",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 12 }, { wch: 34 }, { wch: 36 }, { wch: 36 }, { wch: 28 },
    { wch: 24 }, { wch: 24 }, { wch: 32 }, { wch: 12 }, { wch: 28 },
  ];
  if (sheet["!ref"]) sheet["!autofilter"] = { ref: sheet["!ref"] };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Pendientes");
  XLSX.writeFile(
    workbook,
    `pendientes-reporte-actividades-${year}-${String(month).padStart(2, "0")}.xlsx`,
    { compression: true },
  );
}

export default function Index() {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [groupPending, setGroupPending] = React.useState(false);
  const [exportingPending, setExportingPending] = React.useState(false);

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
  const pendingRecords = monthRecords.filter(isPendingExpediente);
  const nonPendingRecords = monthRecords.filter((r) => !isPendingExpediente(r));

  const pendingGroups = React.useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const record of pendingRecords) {
      const person = String(record.personaContralora || "Sin persona contralora asignada").trim();
      const current = groups.get(person) ?? [];
      current.push(record);
      groups.set(person, current);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [pendingRecords]);

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
              <span className={cn(
                "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold",
                active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-white/15 text-white",
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderRecord = (r: any, idx: number) => (
    <RecordCard
      key={r.id}
      record={r}
      index={idx}
      onView={() => setDetail(r)}
      onEdit={() => openEdit(r)}
      onPrint={() => setPrinting(r)}
      onDelete={() => setToDelete(r)}
    />
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
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-10 rounded-md border border-input bg-white pl-9 pr-8 text-sm font-medium text-ink outline-none focus:border-primary"
              >
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <ExcelImportControls year={year} month={month} monthName={MESES[month - 1] ?? "Mes"} />
            <Button onClick={openNew} size="lg"><Plus className="size-4" /> Agregar</Button>
          </div>
        </header>

        {pendingRecords.length > 0 && (
          <section className="mb-6 rounded-xl border border-red-200 bg-red-50/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
                  <FolderOpen className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">Expedientes pendientes de reporte</p>
                  <p className="text-sm text-red-800/70">{pendingRecords.length} expediente{pendingRecords.length === 1 ? "" : "s"} pendiente{pendingRecords.length === 1 ? "" : "s"} en este mes.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={groupPending ? "secondary" : "outline"}
                  onClick={() => setGroupPending((value) => !value)}
                >
                  <Users className="size-4" />
                  {groupPending ? "Quitar agrupación" : "Agrupar por persona"}
                </Button>
                <Button
                  variant="outline"
                  disabled={exportingPending}
                  onClick={async () => {
                    setExportingPending(true);
                    try {
                      await downloadPendingExcel(pendingRecords, year, month);
                    } finally {
                      setExportingPending(false);
                    }
                  }}
                >
                  {exportingPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Descargar pendientes .xlsx
                </Button>
              </div>
            </div>
          </section>
        )}

        {records.isLoading ? (
          <div className="flex items-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Cargando registros…
          </div>
        ) : monthRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
            <Inbox className="mb-3 size-10 text-muted-foreground/50" />
            <p className="font-display text-lg font-semibold text-ink">Sin registros en {MESES[month - 1]}</p>
            <p className="mb-4 text-sm text-muted-foreground">Agrega el primer registro o importa un archivo Excel de este mes.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <ExcelImportControls year={year} month={month} monthName={MESES[month - 1] ?? "Mes"} />
              <Button onClick={openNew}><Plus className="size-4" /> Nuevo registro</Button>
            </div>
          </div>
        ) : groupPending && pendingRecords.length > 0 ? (
          <div className="space-y-7">
            {pendingGroups.map(([person, group]) => (
              <section key={person}>
                <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                  <Users className="size-4 text-red-700" />
                  <h2 className="font-display text-lg font-semibold text-wine-900">{person}</h2>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{group.length}</span>
                </div>
                <div className="space-y-3">{group.map((r, idx) => renderRecord(r, idx))}</div>
              </section>
            ))}
            {nonPendingRecords.length > 0 && (
              <section>
                <div className="mb-3 border-b border-border pb-2">
                  <h2 className="font-display text-lg font-semibold text-wine-900">Otros registros</h2>
                </div>
                <div className="space-y-3">{nonPendingRecords.map((r, idx) => renderRecord(r, idx))}</div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-3">{monthRecords.map((r, idx) => renderRecord(r, idx))}</div>
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
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={del.isPending}>Cancelar</Button>
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
          ¿Seguro que deseas eliminar el registro <b className="text-ink">#{toDelete?.consecutivo}</b> — {toDelete?.asunto || "sin asunto"}? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </Layout>
  );
}

function RecordCard({ record: r, index, onView, onEdit, onPrint, onDelete }: {
  record: any;
  index: number;
  onView: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onDelete: () => void;
}) {
  const expediente = r.esExpediente === true;
  const finalizado = r.expedienteEstado === "finalizado";

  return (
    <article
      className={cn(
        "relative animate-rise overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        expediente && finalizado ? "border-green-200" : expediente ? "border-red-200" : "border-border",
      )}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      {expediente && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-1.5",
            finalizado ? "bg-green-600" : "bg-red-600",
          )}
          title={finalizado ? "Expediente finalizado" : "Expediente pendiente"}
        />
      )}
      <div className={cn("flex flex-wrap items-start justify-between gap-4", expediente && "pl-2")}>
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="text-[10px] font-semibold uppercase">No.</span>
            <span className="font-display text-lg font-bold leading-none">{r.consecutivo}</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-wine-900">{r.asunto || "Sin asunto"}</h3>
              {expediente && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  finalizado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
                )}>
                  {finalizado ? "Finalizado" : "Pendiente"}
                </span>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {r.ente || "Ente no especificado"}{r.numeroOficioEnte ? ` · Oficio ${r.numeroOficioEnte}` : ""}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">Recep. {fmtDate(r.fechaRecepcionOficialia)}</span>
              {r.tipoSesion && <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{r.tipoSesion}</span>}
              {r.consecutivoFolio && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-wine-900">{r.consecutivoFolio}</span>}
              {expediente && !finalizado && r.reporteFechaLimite && (
                <span className={cn(
                  "rounded-full px-2 py-0.5",
                  r.reporteVencido ? "bg-red-100 font-semibold text-red-800" : "bg-amber-100 text-amber-900",
                )}>
                  Reporte límite: {fmtLocalDateTime(r.reporteFechaLimite)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <IconBtn title="Ver" onClick={onView}><Eye className="size-4" /></IconBtn>
          <IconBtn title="Editar" onClick={onEdit}><Pencil className="size-4" /></IconBtn>
          <IconBtn title="Imprimir" onClick={onPrint}><Printer className="size-4" /></IconBtn>
          <IconBtn title="Eliminar" danger onClick={onDelete}><Trash2 className="size-4" /></IconBtn>
        </div>
      </div>
    </article>
  );
}

function IconBtn({ children, title, onClick, danger }: {
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
