const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

const WEEKDAY_NAMES = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
] as const;

function parseDateOnly(
  value: string | null | undefined,
): {
  year: number;
  month: number;
  day: number;
} | null {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !year ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return { year, month, day };
}

function fmtFechaRecepcionOficialia(
  value: string | null | undefined,
): string {
  const parts = parseDateOnly(value);

  if (!parts) return value ?? "";

  const weekdayIndex = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day),
  ).getUTCDay();

  const weekday = WEEKDAY_NAMES[weekdayIndex] ?? "";
  const month = MONTH_NAMES[parts.month - 1] ?? "";

  return `${weekday}, ${parts.day} de ${month} de ${parts.year}`;
}

function fmtHoraEnTexto(
  value: string | null | undefined,
): string {
  if (!value) return "";

  const match = value.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return value;

  const hour = match[1].padStart(2, "0");

  return `a las ${hour}:${match[2]} horas`;
}

function fmtFechaHoraRecepcionOficialia(
  fecha: string | null | undefined,
  hora: string | null | undefined,
): string {
  const fechaTexto =
    fmtFechaRecepcionOficialia(fecha);

  const horaTexto =
    fmtHoraEnTexto(hora);

  return [fechaTexto, horaTexto]
    .filter(Boolean)
    .join(" ");
}

function fmtFechaHoraSesion(
  value: string | null | undefined,
): string {
  if (!value) return "";

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})/,
  );

  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const hour =
    match[4].padStart(2, "0");

  const minute = match[5];

  const monthName =
    MONTH_NAMES[month - 1] ?? "";

  return (
    `${day} de ${monthName} de ${year} ` +
    `a las ${hour}:${minute} horas`
  );
}

/**
 * Elige la plantilla para un registro entre las disponibles.
 * Prioridad: 1) misma regla + misma firma  2) misma regla sin firma
 *            3) null => la UI pregunta cuál usar.
 */
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
