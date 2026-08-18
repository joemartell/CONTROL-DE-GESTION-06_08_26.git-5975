import * as React from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { useImportExcelRecords } from "../queries/records";

const IMPORT_COLUMNS = [
  ["Fecha recepción oficialía", "fechaRecepcionOficialia", "2026-08-04", "Obligatorio. Formato YYYY-MM-DD."],
  ["Hora recepción", "horaRecepcion", "16:21", "Formato HH:mm."],
  ["Fecha y hora recepción DCC", "fechaHoraRecepcionDcc", "2026-08-04T16:30", "Formato YYYY-MM-DDTHH:mm."],
  ["Volante Oficialía / Correo", "volanteOficialia", "VOL-123", "Texto libre."],
  ["Número de oficio ente", "numeroOficioEnte", "SGIRPC/DEAF/123/2026", "Texto libre."],
  ["Signado por", "signadoPor", "M.D. Erika Alejandra Barba Luna", "Texto libre o valor del catálogo."],
  ["Cargo / Puesto", "cargoPuesto", "Directora Ejecutiva de Administración y Finanzas", "Texto libre o valor del catálogo."],
  ["Asunto", "asunto", "Convocatoria", "Ej. Convocatoria o EXTEMPORÁNEO."],
  ["Ente", "ente", "Secretaría de Gestión Integral de Riesgos y Protección Civil", "Texto libre o valor del catálogo."],
  ["Órgano Colegiado", "organoColegiado", "Subcomité de Adquisiciones", "Texto libre o valor del catálogo."],
  ["Fecha y hora de sesión", "fechaHoraSesion", "2026-08-06T11:00", "Formato YYYY-MM-DDTHH:mm."],
  ["Número de sesión", "numeroSesion", "03", "Texto o número."],
  ["Tipo de sesión", "tipoSesion", "Ordinaria", "Texto libre o valor del catálogo."],
  ["Persona contralora convocada", "personaContralora", "María Pérez López", "Texto libre o valor del catálogo."],
  ["Persona contralora suplente", "personaContraloraSuplente", "José Hernández Díaz", "Texto libre o valor del catálogo."],
  ["Carpeta de trabajo", "carpetaTrabajo", "Sí", "Usa Sí o No."],
  ["Sesión virtual / presencial", "sesionVirtualPresencial", "Sí", "Usa Sí o No."],
  ["Datos de la sesión", "sesionVirtualDetalle", "Sala de juntas / enlace de videoconferencia", "Texto libre."],
  ["Consecutivo folio", "consecutivoFolio", "SCG/DCC/CE/0123/2026", "Texto libre."],
  ["Firma", "firma", "LMD", "Ej. LMD, MDCT, MAPG, SYOM o ACP."],
  ["C.C.E.P.", "ccep", "Titular del Órgano Interno de Control", "Solo se conserva cuando Asunto = EXTEMPORÁNEO."],
  ["Entrega de reporte de Actividades", "reporteActividadesEstado", "entregado", "Solo aplica a CONVOCATORIA. Usa entregado, no entregado o deja vacío. Si queda vacío, el sistema marca no entregado automáticamente al vencer 5 días hábiles desde la sesión."],
] as const;

type ImportField = (typeof IMPORT_COLUMNS)[number][1];
type ImportRow = Partial<Record<ImportField, string>>;

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function normalizeReportStatus(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  if (normalized === "entregado") return "entregado";
  if (normalized === "no entregado" || normalized === "noentregado") return "no entregado";
  return "";
}

const HEADER_MAP = new Map(
  IMPORT_COLUMNS.map(([header, field]) => [normalizeHeader(header), field]),
);

export function ExcelImportControls({
  year,
  month,
  monthName,
}: {
  year: number;
  month: number;
  monthName: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const importing = useImportExcelRecords();

  const downloadGuide = async () => {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();

    const headers = IMPORT_COLUMNS.map(([header]) => header);
    const example = IMPORT_COLUMNS.map(([, , value]) => value);

    const dataSheet = XLSX.utils.aoa_to_sheet([headers]);
    dataSheet["!cols"] = IMPORT_COLUMNS.map(([header, , exampleValue]) => ({
      wch: Math.min(42, Math.max(16, header.length + 2, exampleValue.length + 2)),
    }));
    dataSheet["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(headers.length - 1)}1` };
    XLSX.utils.book_append_sheet(workbook, dataSheet, "Registros");

    const exampleSheet = XLSX.utils.aoa_to_sheet([headers, example]);
    exampleSheet["!cols"] = dataSheet["!cols"];
    XLSX.utils.book_append_sheet(workbook, exampleSheet, "Ejemplo");

    const guideRows = [
      ["Campo", "Campo interno", "Ejemplo", "Indicaciones"],
      ...IMPORT_COLUMNS.map(([header, field, exampleValue, help]) => [header, field, exampleValue, help]),
    ];
    const guideSheet = XLSX.utils.aoa_to_sheet(guideRows);
    guideSheet["!cols"] = [{ wch: 32 }, { wch: 28 }, { wch: 42 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, guideSheet, "Guía de campos");

    XLSX.writeFile(workbook, "guia-importacion-control-gestion.xlsx", { compression: true });
  };

  const readFile = async (file: File) => {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) throw new Error("El archivo no contiene hojas.");

    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) throw new Error("No fue posible leer la primera hoja del archivo.");

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
    if (rawRows.length === 0) throw new Error("El archivo no contiene registros para importar.");

    const normalizedKeys = Object.keys(rawRows[0] ?? {}).map(normalizeHeader);
    if (!normalizedKeys.includes(normalizeHeader("Fecha recepción oficialía"))) {
      throw new Error("Falta la columna obligatoria «Fecha recepción oficialía». Usa el archivo guía.");
    }

    const rows: ImportRow[] = rawRows.map((raw) => {
      const mapped: ImportRow = {};
      for (const [header, value] of Object.entries(raw)) {
        const field = HEADER_MAP.get(normalizeHeader(header));
        if (!field) continue;
        const text = value == null ? "" : String(value).trim();
        mapped[field] = field === "reporteActividadesEstado" ? normalizeReportStatus(text) : text;
      }
      return mapped;
    });

    const result = await importing.mutateAsync({ anio: year, mes: month, rows });
    window.alert(`Importación completada: ${result.imported} registro(s) cargado(s) en ${monthName} de ${year}.`);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            await readFile(file);
          } catch (error) {
            const message = error instanceof Error ? error.message : "No fue posible importar el archivo Excel.";
            window.alert(message);
          }
        }}
      />

      <Button variant="outline" size="lg" onClick={() => void downloadGuide()} disabled={importing.isPending} title="Descargar archivo Excel de ejemplo y guía de campos">
        <Download className="size-4" /> Guía Excel
      </Button>

      <Button variant="outline" size="lg" onClick={() => inputRef.current?.click()} disabled={importing.isPending}>
        {importing.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        Importar Excel
        <FileSpreadsheet className="size-4" />
      </Button>
    </>
  );
}
