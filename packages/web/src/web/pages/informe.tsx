import * as React from "react";
import { Download, FileSpreadsheet, Loader2, Rows3 } from "lucide-react";
import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { useAllRecords, useRecordsByMonth, useYears } from "../queries/records";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

function formatDateOnly(value: unknown): string {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return text;

  const [, year = "", month = "", day = ""] = match;
  const monthIndex = Number(month) - 1;
  const monthName = MESES[monthIndex]?.toLocaleLowerCase("es-MX") ?? month;
  return `${Number(day)} de ${monthName} de ${year}`;
}

function formatDateTime(value: unknown): string {
  if (!value) return "";
  const text = String(value);
  const localMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (localMatch) {
    const [, year = "", month = "", day = "", hour = "", minute = ""] = localMatch;
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  const date = value instanceof Date ? value : new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function toExcelRow(record: Record<string, unknown>) {
  return {
    "ID": record.id ?? "",
    "Consecutivo": record.consecutivo ?? "",
    "Mes": MESES[Number(record.mes ?? 1) - 1] ?? record.mes ?? "",
    "Año": record.anio ?? "",
    "Fecha recepción Oficialía": formatDateOnly(record.fechaRecepcionOficialia),
    "Hora recepción": record.horaRecepcion ?? "",
    "Fecha y hora recepción DCC": formatDateTime(record.fechaHoraRecepcionDcc),
    "Medio por el cual se recibió": record.medioRecepcion ?? "",
    "Volante Oficialía / Correo": record.volanteOficialia ?? "",
    "Número de oficio ente": record.numeroOficioEnte ?? "",
    "Signado por": record.signadoPor ?? "",
    "Cargo / Puesto": record.cargoPuesto ?? "",
    "Asunto": record.asunto ?? "",
    "Ente": record.ente ?? "",
    "Órgano Colegiado": record.organoColegiado ?? "",
    "Fecha y hora de sesión": formatDateTime(record.fechaHoraSesion),
    "Número de sesión": record.numeroSesion ?? "",
    "Tipo de sesión": record.tipoSesion ?? "",
    "Persona contralora convocada": record.personaContralora ?? "",
    "Persona contralora suplente": record.personaContraloraSuplente ?? "",
    "Carpeta de trabajo": record.carpetaTrabajo ?? "",
    "Sesión virtual / presencial": record.sesionVirtualPresencial ?? "",
    "Datos de la sesión": record.sesionVirtualDetalle ?? "",
    "Consecutivo folio": record.consecutivoFolio ?? "",
    "Firma": record.firma ?? "",
    "C.C.E.P.": record.ccep ?? "",
    "Expediente": record.esExpediente ? "Sí" : "No",
    "Estatus del expediente": record.expedienteEstado === "finalizado" ? "Finalizado" : record.expedienteEstado === "pendiente" ? "Pendiente" : "",
    "Entrega de reporte de Actividades": record.reporteActividadesEstado === "entregado" ? "Entregado" : record.reporteActividadesEstado === "no entregado" ? "No entregado" : record.esExpediente ? "Pendiente" : "",
    "Fecha límite del reporte": formatDateTime(record.reporteFechaLimite),
    "Reporte vencido": record.reporteVencido ? "Sí" : record.esExpediente ? "No" : "",
    "Creado": formatDateTime(record.createdAt),
    "Actualizado": formatDateTime(record.updatedAt),
  };
}

async function downloadExcel(records: Record<string, unknown>[], filename: string, sheetName: string) {
  const XLSX = await import("xlsx");
  const rows = records.map(toExcelRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  worksheet["!cols"] = headers.map((header) => {
    const longestValue = Math.max(
      header.length,
      ...rows.map((row) => String(row[header as keyof typeof row] ?? "").length),
    );
    return { wch: Math.min(45, Math.max(12, longestValue + 2)) };
  });

  if (worksheet["!ref"]) worksheet["!autofilter"] = { ref: worksheet["!ref"] };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename, { compression: true });
}

export default function Informe() {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [downloading, setDownloading] = React.useState<"month" | "all" | null>(null);

  const years = useYears();
  const monthly = useRecordsByMonth(year, month);
  const allRecords = useAllRecords();

  const yearOptions = React.useMemo(() => {
    const values = new Set<number>([now.getFullYear(), year, ...(years.data ?? [])]);
    return [...values].sort((a, b) => b - a);
  }, [years.data, year, now]);

  const monthlyRecords = (monthly.data ?? []) as Record<string, unknown>[];
  const completeRecords = (allRecords.data ?? []) as Record<string, unknown>[];

  const exportMonth = async () => {
    if (monthlyRecords.length === 0) return;
    setDownloading("month");
    try {
      const monthNumber = String(month).padStart(2, "0");
      await downloadExcel(monthlyRecords, `informe-registros-${year}-${monthNumber}.xlsx`, `${MESES[month - 1]} ${year}`);
    } finally {
      setDownloading(null);
    }
  };

  const exportAll = async () => {
    if (completeRecords.length === 0) return;
    setDownloading("all");
    try {
      const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
      await downloadExcel(completeRecords, `informe-registros-completo-${today}.xlsx`, "Todos los registros");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <header className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">Exportación de datos</p>
          <h1 className="font-display text-4xl font-bold text-wine-900">Informe</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Descarga los registros en formato Excel (.xlsx) por mes o genera un archivo consolidado con todos los meses y años disponibles. Los informes incluyen el seguimiento de expedientes de CONVOCATORIA.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Rows3 className="size-5" /></div>
              <div><h2 className="font-display text-xl font-semibold text-wine-900">Informe mensual</h2><p className="mt-1 text-sm text-muted-foreground">Selecciona el año y mes que deseas exportar.</p></div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Año</label>
                <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                  {yearOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mes</label>
                <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                  {MESES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-secondary/40 px-4 py-3">
              {monthly.isLoading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Consultando registros…</p> : <p className="text-sm text-ink"><b>{monthlyRecords.length}</b> registro{monthlyRecords.length === 1 ? "" : "s"} en {MESES[month - 1]} de {year}.</p>}
            </div>

            <Button className="mt-5 w-full" size="lg" onClick={exportMonth} disabled={monthly.isLoading || monthlyRecords.length === 0 || downloading !== null}>
              {downloading === "month" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Descargar mes en .xlsx
            </Button>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-wine-900"><FileSpreadsheet className="size-5" /></div>
              <div><h2 className="font-display text-xl font-semibold text-wine-900">Informe completo</h2><p className="mt-1 text-sm text-muted-foreground">Exporta todos los registros existentes en una sola hoja de Excel.</p></div>
            </div>

            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
              {allRecords.isLoading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Consultando registros…</p> : <p className="text-sm text-ink"><b>{completeRecords.length}</b> registro{completeRecords.length === 1 ? "" : "s"} en el consolidado general.</p>}
            </div>

            <div className="mt-5 rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-wine-900">
              Incluye todos los meses y años, Oficialía, medio de recepción, sesión, personas contraloras, folio, firma, C.C.E.P., estado del expediente y seguimiento del reporte de actividades.
            </div>

            <Button className="mt-5 w-full" size="lg" onClick={exportAll} disabled={allRecords.isLoading || completeRecords.length === 0 || downloading !== null}>
              {downloading === "all" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Descargar todos los registros
            </Button>
          </section>
        </div>
      </div>
    </Layout>
  );
}
