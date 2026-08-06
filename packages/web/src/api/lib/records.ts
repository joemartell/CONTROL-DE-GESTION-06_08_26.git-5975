export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export const RULE_KEYS = [
  "convocatoria",
  "extemporaneo",
  "no_carpeta_si_virtual",
  "si_carpeta_no_virtual",
  "ambos_no",
] as const;
export type RuleKey = (typeof RULE_KEYS)[number];

export const RULE_LABELS: Record<RuleKey, string> = {
  convocatoria: "ASUNTO = Convocatoria",
  extemporaneo: "ASUNTO = Extemporáneo",
  no_carpeta_si_virtual: "Carpeta de trabajo = No · Sesión virtual/presencial = Sí",
  si_carpeta_no_virtual: "Carpeta de trabajo = Sí · Sesión virtual/presencial = No",
  ambos_no: "Carpeta de trabajo = No · Sesión virtual/presencial = No",
};

const norm = (s: string | null | undefined) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const isSi = (s: string | null | undefined) => norm(s) === "si";
const isNo = (s: string | null | undefined) => norm(s) === "no";

// Determina la plantilla por reglas. Devuelve null si ninguna regla aplica
// (en ese caso la UI pregunta qué plantilla usar).
export function resolveRuleKey(r: {
  asunto?: string | null;
  carpetaTrabajo?: string | null;
  sesionVirtualPresencial?: string | null;
}): RuleKey | null {
  const asunto = norm(r.asunto);
  if (asunto === "convocatoria") return "convocatoria";
  if (asunto === "extemporaneo") return "extemporaneo";

  const carpeta = r.carpetaTrabajo;
  const virtual = r.sesionVirtualPresencial;
  if (isNo(carpeta) && isSi(virtual)) return "no_carpeta_si_virtual";
  if (isSi(carpeta) && isNo(virtual)) return "si_carpeta_no_virtual";
  if (isNo(carpeta) && isNo(virtual)) return "ambos_no";
  return null;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// Datos disponibles como {etiquetas} dentro de la plantilla .docx
export function buildTemplateData(r: Record<string, unknown>) {
  const rec = r as {
    consecutivo: number; mes: number; anio: number;
    fechaRecepcionOficialia: string | null; horaRecepcion: string | null;
    fechaHoraRecepcionDcc: string | null; volanteOficialia: string | null;
    numeroOficioEnte: string | null; signadoPor: string | null; cargoPuesto: string | null;
    asunto: string | null; ente: string | null; organoColegiado: string | null;
    fechaHoraSesion: string | null; numeroSesion: string | null; tipoSesion: string | null;
    carpetaTrabajo: string | null; sesionVirtualPresencial: string | null;
    sesionVirtualDetalle: string | null; consecutivoFolio: string | null;
    firma: string | null; personaContralora: string | null;
  };
  return {
    consecutivo: String(rec.consecutivo ?? ""),
    mes: MESES[(rec.mes ?? 1) - 1] ?? "",
    anio: String(rec.anio ?? ""),
    fecha_recepcion_oficialia: fmtDate(rec.fechaRecepcionOficialia),
    hora_recepcion: rec.horaRecepcion ?? "",
    fecha_hora_recepcion_dcc: fmtDateTime(rec.fechaHoraRecepcionDcc),
    volante_oficialia: rec.volanteOficialia ?? "",
    numero_oficio_ente: rec.numeroOficioEnte ?? "",
    signado_por: rec.signadoPor ?? "",
    cargo_puesto: rec.cargoPuesto ?? "",
    asunto: rec.asunto ?? "",
    ente: rec.ente ?? "",
    organo_colegiado: rec.organoColegiado ?? "",
    fecha_hora_sesion: fmtDateTime(rec.fechaHoraSesion),
    numero_sesion: rec.numeroSesion ?? "",
    tipo_sesion: rec.tipoSesion ?? "",
    carpeta_trabajo: rec.carpetaTrabajo ?? "",
    sesion_virtual_presencial: rec.sesionVirtualPresencial ?? "",
    // Texto capturado en "Datos de la sesión:" cuando la sesión es Sí.
    datos_sesion: rec.sesionVirtualDetalle ?? "",
    // Alias anterior, se conserva para plantillas ya existentes.
    sesion_virtual_detalle: rec.sesionVirtualDetalle ?? "",
    consecutivo_folio: rec.consecutivoFolio ?? "",
    firma: rec.firma ?? "",
    persona_contralora: rec.personaContralora ?? "",
    fecha_impresion: new Date().toLocaleDateString("es-MX", {
      day: "2-digit", month: "long", year: "numeric",
    }),
  };
}

export const OPTION_FIELDS = [
  "asunto", "ente", "signadoPor", "cargoPuesto",
  "organoColegiado", "tipoSesion", "personaContralora", "firma",
] as const;
export type OptionField = (typeof OPTION_FIELDS)[number];

// Siglas de FIRMA precargadas (el combobox sigue siendo creable: se pueden añadir más).
export const FIRMA_DEFAULTS = ["LMD", "MDCT", "MAPG", "SYOM", "ACP"] as const;
