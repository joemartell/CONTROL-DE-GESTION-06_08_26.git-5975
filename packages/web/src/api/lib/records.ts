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

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

const WEEKDAY_NAMES = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
] as const;

function parseDateOnly(value: string | null | undefined): {
  year: number;
  month: number;
  day: number;
} | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, rawYear = "", rawMonth = "", rawDay = ""] = match;
  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

function fmtDate(iso: string | null | undefined): string {
  const parts = parseDateOnly(iso);
  if (!parts) return iso ?? "";

  const weekdayIndex = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const weekday = WEEKDAY_NAMES[weekdayIndex] ?? "";
  const month = MONTH_NAMES[parts.month - 1] ?? "";

  return `${weekday}, ${parts.day} de ${month} de ${parts.year}`;
}

function fmtHoraRecepcion(value: string | null | undefined): string {
  if (!value) return "";
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;

  const [, rawHour = "", minute = ""] = match;
  const hour = rawHour.padStart(2, "0");
  return `a las ${hour}:${minute} horas`;
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

function fmtFechaHoraSesion(value: string | null | undefined): string {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})/);
  if (!match) return value;

  const [,
    rawYear = "",
    rawMonth = "",
    rawDay = "",
    rawHour = "",
    minute = "",
  ] = match;

  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  const hour = rawHour.padStart(2, "0");
  const monthName = MONTH_NAMES[month - 1] ?? "";

  return `${day} de ${monthName} de ${year} a las ${hour}:${minute} horas`;
}

const TITLE_CASE_LOWER_WORDS = new Set([
  "a", "al", "con", "de", "del", "desde", "e", "el", "en", "entre",
  "la", "las", "los", "o", "para", "por", "sin", "u", "y",
]);

const TITLE_CASE_ACRONYMS = new Set([
  "CAAPS", "CARECI", "CDMX", "CE", "CURP", "DCC", "IR", "ISSSTE", "JUD",
  "LP", "RFC", "SAAPS", "SCG", "UAM", "UNAM",
]);

function toMayusculas(value: string | null | undefined): string {
  return (value ?? "").toLocaleUpperCase("es-MX");
}

function toMinusculas(value: string | null | undefined): string {
  return (value ?? "").toLocaleLowerCase("es-MX");
}

function isAcronymToken(value: string): boolean {
  const upper = value.toLocaleUpperCase("es-MX");
  if (/^(?:[A-ZÁÉÍÓÚÜÑ]\.){2,}$/u.test(upper)) return true;

  const pieces = upper.split(/[\/-]/);
  return pieces.length > 0 && pieces.every((piece) => TITLE_CASE_ACRONYMS.has(piece));
}

function toIntercalado(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  if (!text) return "";

  let wordIndex = 0;
  return text
    .split(/\s+/)
    .map((raw) => {
      const leading = raw.match(/^[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]*/u)?.[0] ?? "";
      const trailing = raw.match(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.]*$/u)?.[0] ?? "";
      const core = raw.slice(leading.length, raw.length - trailing.length);
      if (!core) return raw;

      const lower = core.toLocaleLowerCase("es-MX");
      const isFirstWord = wordIndex === 0;
      wordIndex += 1;

      let formatted: string;
      if (isAcronymToken(core)) {
        formatted = core.toLocaleUpperCase("es-MX");
      } else if (!isFirstWord && TITLE_CASE_LOWER_WORDS.has(lower)) {
        formatted = lower;
      } else {
        formatted = lower.replace(
          /(^|[\/-])([a-záéíóúüñ])/gu,
          (_match, separator: string, letter: string) =>
            `${separator}${letter.toLocaleUpperCase("es-MX")}`,
        );
      }

      return `${leading}${formatted}${trailing}`;
    })
    .join(" ");
}

function caseVariants(prefix: string, value: string | null | undefined): Record<string, string> {
  const original = value ?? "";
  return {
    [prefix]: original,
    [`${prefix}_mayusculas`]: toMayusculas(original),
    [`${prefix}_minusculas`]: toMinusculas(original),
    [`${prefix}_intercalado`]: toIntercalado(original),
  };
}

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
    personaContraloraSuplente: string | null;
  };
  return {
    consecutivo: String(rec.consecutivo ?? ""),
    mes: MESES[(rec.mes ?? 1) - 1] ?? "",
    anio: String(rec.anio ?? ""),
    fecha_recepcion_oficialia: fmtDate(rec.fechaRecepcionOficialia),
    hora_recepcion: fmtHoraRecepcion(rec.horaRecepcion),
    fecha_hora_recepcion_dcc: fmtDateTime(rec.fechaHoraRecepcionDcc),
    volante_oficialia: rec.volanteOficialia ?? "",
    numero_oficio_ente: rec.numeroOficioEnte ?? "",
    ...caseVariants("signado_por", rec.signadoPor),
    ...caseVariants("cargo_puesto", rec.cargoPuesto),
    ...caseVariants("asunto", rec.asunto),
    ...caseVariants("ente", rec.ente),
    ...caseVariants("organo_colegiado", rec.organoColegiado),
    fecha_hora_sesion: fmtFechaHoraSesion(rec.fechaHoraSesion),
    numero_sesion: rec.numeroSesion ?? "",
    ...caseVariants("tipo_sesion", rec.tipoSesion),
    carpeta_trabajo: rec.carpetaTrabajo ?? "",
    sesion_virtual_presencial: rec.sesionVirtualPresencial ?? "",
    ...caseVariants("datos_sesion", rec.sesionVirtualDetalle),
    ...caseVariants("sesion_virtual_detalle", rec.sesionVirtualDetalle),
    consecutivo_folio: rec.consecutivoFolio ?? "",
    firma: rec.firma ?? "",
    ...caseVariants("persona_contralora", rec.personaContralora),
    ...caseVariants("persona_contralora_suplente", rec.personaContraloraSuplente),
    fecha_impresion: new Date().toLocaleDateString("es-MX", {
      day: "2-digit", month: "long", year: "numeric",
    }),
  };
}

export const OPTION_FIELDS = [
  "asunto", "ente", "signadoPor", "cargoPuesto",
  "organoColegiado", "tipoSesion", "personaContralora", "personaContraloraSuplente", "firma",
] as const;
export type OptionField = (typeof OPTION_FIELDS)[number];

export const FIRMA_DEFAULTS = ["LMD", "MDCT", "MAPG", "SYOM", "ACP"] as const;

export function normalizaFirma(v: string | null | undefined): string | null {
  const s = norm(v).replace(/\s+/g, "").toUpperCase();
  return s || null;
}

export function eligePlantilla<T extends { ruleKey: string | null; firma: string | null }>(
  plantillas: T[],
  ruleKey: RuleKey | null,
  firmaRegistro: string | null | undefined,
): { template: T | null; matchedBy: "regla_y_firma" | "regla" | null } {
  if (!ruleKey) return { template: null, matchedBy: null };

  const deLaRegla = plantillas.filter((t) => t.ruleKey === ruleKey);
  const firma = normalizaFirma(firmaRegistro);

  if (firma) {
    const porFirma = deLaRegla.find((t) => normalizaFirma(t.firma) === firma);
    if (porFirma) return { template: porFirma, matchedBy: "regla_y_firma" };
  }

  const general = deLaRegla.find((t) => !normalizaFirma(t.firma));
  if (general) return { template: general, matchedBy: "regla" };

  return { template: null, matchedBy: null };
}
