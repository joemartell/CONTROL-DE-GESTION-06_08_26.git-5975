import * as React from "react";
import { Download, Eye, Loader2, Pencil, RefreshCcw, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Input, Textarea } from "./ui/input";

const FIELD_LABELS: Record<string, string> = {
  consecutivo: "Consecutivo",
  mes: "Mes",
  anio: "Año",
  fecha_recepcion_oficialia: "Fecha de recepción oficialía",
  hora_recepcion: "Hora de recepción",
  fecha_hora_recepcion_dcc: "Fecha y hora de recepción DCC",
  medio_recepcion: "Medio por el cual se recibió",
  volante_oficialia: "Volante Oficialía / Correo",
  numero_oficio_ente: "Número de oficio ente",
  signado_por: "Signado por",
  cargo_puesto: "Cargo / Puesto",
  asunto: "Asunto",
  ente: "Ente",
  organo_colegiado: "Órgano Colegiado",
  fecha_hora_sesion: "Fecha y hora de sesión",
  numero_sesion: "Número de sesión",
  tipo_sesion: "Tipo de sesión",
  carpeta_trabajo: "Carpeta de trabajo",
  sesion_virtual_presencial: "Sesión virtual / presencial",
  datos_sesion: "Datos de la sesión",
  consecutivo_folio: "Consecutivo folio",
  firma: "Firma",
  elaborado_por: "Elaborado por",
  persona_contralora: "Persona contralora convocada",
  persona_contralora_suplente: "Persona contralora suplente",
  ccep: "C.C.E.P.",
  fecha_impresion: "Fecha de impresión",
};

const TITLE_CASE_LOWER_WORDS = new Set([
  "a", "al", "con", "de", "del", "desde", "e", "el", "en", "entre",
  "la", "las", "los", "o", "para", "por", "sin", "u", "y",
]);

const TITLE_CASE_ACRONYMS = new Set([
  "CAAPS", "CARECI", "CDMX", "CE", "CURP", "DCC", "IR", "ISSSTE", "JUD",
  "LP", "RFC", "SAAPS", "SCG", "UAM", "UNAM",
]);

function toIntercalado(value: string): string {
  const text = value.trim();
  if (!text) return "";

  let index = 0;
  return text.split(/\s+/).map((raw) => {
    const upper = raw.toLocaleUpperCase("es-MX");
    if (/^(?:[A-ZÁÉÍÓÚÜÑ]\.){2,}$/u.test(upper) || TITLE_CASE_ACRONYMS.has(upper)) {
      index += 1;
      return upper;
    }

    const lower = raw.toLocaleLowerCase("es-MX");
    const first = index === 0;
    index += 1;
    if (!first && TITLE_CASE_LOWER_WORDS.has(lower)) return lower;

    return lower.replace(
      /(^|[\/-])([a-záéíóúüñ])/gu,
      (_match, separator: string, letter: string) =>
        `${separator}${letter.toLocaleUpperCase("es-MX")}`,
    );
  }).join(" ");
}

function baseEditableKeys(data: Record<string, string>): string[] {
  return Object.keys(data).filter((key) => {
    if (key.endsWith("_mayusculas") || key.endsWith("_minusculas") || key.endsWith("_intercalado")) {
      return false;
    }
    // Es un alias de datos_sesion y se actualiza junto con ese campo.
    if (key === "sesion_virtual_detalle" && "datos_sesion" in data) return false;
    return true;
  });
}

function applyFieldChange(
  current: Record<string, string>,
  key: string,
  value: string,
): Record<string, string> {
  const next = { ...current, [key]: value };

  if (`${key}_mayusculas` in current) {
    next[`${key}_mayusculas`] = value.toLocaleUpperCase("es-MX");
  }
  if (`${key}_minusculas` in current) {
    next[`${key}_minusculas`] = value.toLocaleLowerCase("es-MX");
  }
  if (`${key}_intercalado` in current) {
    next[`${key}_intercalado`] = toIntercalado(value);
  }

  if (key === "datos_sesion" && "sesion_virtual_detalle" in current) {
    next.sesion_virtual_detalle = value;
    if ("sesion_virtual_detalle_mayusculas" in current) {
      next.sesion_virtual_detalle_mayusculas = value.toLocaleUpperCase("es-MX");
    }
    if ("sesion_virtual_detalle_minusculas" in current) {
      next.sesion_virtual_detalle_minusculas = value.toLocaleLowerCase("es-MX");
    }
    if ("sesion_virtual_detalle_intercalado" in current) {
      next.sesion_virtual_detalle_intercalado = toIntercalado(value);
    }
  }

  return next;
}

function getFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/i);
  return match?.[1] ?? fallback;
}

export function DocxPreviewEditor({
  recordId,
  templateId,
}: {
  recordId: number;
  templateId: number;
}) {
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [original, setOriginal] = React.useState<Record<string, string>>({});
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [filename, setFilename] = React.useState("documento.docx");
  const [search, setSearch] = React.useState("");
  const [loadingData, setLoadingData] = React.useState(true);
  const [rendering, setRendering] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const renderPreview = React.useCallback(async (overrides: Record<string, string>) => {
    if (!previewRef.current) return;
    setRendering(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/records/${recordId}/print-preview?templateId=${templateId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overrides }),
        },
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "No se pudo generar la vista previa.");
      }

      const arrayBuffer = await response.arrayBuffer();
      const container = previewRef.current;
      container.innerHTML = "";
      const { renderAsync } = await import("docx-preview");
      await renderAsync(arrayBuffer, container, container, {
        className: "docx-preview",
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        useBase64URL: true,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo generar la vista previa.");
    } finally {
      setRendering(false);
    }
  }, [recordId, templateId]);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingData(true);
    setError(null);

    void fetch(`/api/records/${recordId}/print-data?templateId=${templateId}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(payload?.error ?? "No se pudieron cargar los datos del documento.");
        }
        return response.json() as Promise<{
          filename: string;
          data: Record<string, string>;
        }>;
      })
      .then(async (payload) => {
        if (cancelled) return;
        const normalized = Object.fromEntries(
          Object.entries(payload.data ?? {}).map(([key, value]) => [key, String(value ?? "")]),
        );
        setFilename(payload.filename || "documento.docx");
        setOriginal(normalized);
        setValues(normalized);
        setLoadingData(false);
        await renderPreview(normalized);
      })
      .catch((cause) => {
        if (cancelled) return;
        setLoadingData(false);
        setError(cause instanceof Error ? cause.message : "No se pudieron cargar los datos.");
      });

    return () => {
      cancelled = true;
    };
  }, [recordId, templateId, renderPreview]);

  const keys = React.useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("es-MX");
    return baseEditableKeys(values).filter((key) => {
      if (!needle) return true;
      const label = FIELD_LABELS[key] ?? key.replaceAll("_", " ");
      return label.toLocaleLowerCase("es-MX").includes(needle) || key.includes(needle);
    });
  }, [values, search]);

  const dirty = React.useMemo(
    () => Object.keys(values).some((key) => values[key] !== original[key]),
    [values, original],
  );

  const reset = async () => {
    setValues(original);
    await renderPreview(original);
  };

  const downloadEdited = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/records/${recordId}/print?templateId=${templateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: values }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "No se pudo descargar el documento editado.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = getFilename(response, filename);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo descargar el documento.");
    } finally {
      setDownloading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Preparando documento…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3">
        <div className="text-sm">
          <p className="font-semibold text-ink">Vista previa editable</p>
          <p className="text-xs text-muted-foreground">
            Edita los valores; el DOCX se regenera desde la plantilla para conservar su fuente, tamaño y estilos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void reset()} disabled={!dirty || rendering || downloading}>
            <RotateCcw className="size-4" /> Restablecer
          </Button>
          <Button variant="outline" onClick={() => void renderPreview(values)} disabled={rendering || downloading}>
            {rendering ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
            Actualizar vista previa
          </Button>
          <Button onClick={() => void downloadEdited()} disabled={rendering || downloading}>
            {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Descargar DOCX editado
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-wine-900">
              <Pencil className="size-4" /> Editar contenido
            </div>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar campo…"
            />
          </div>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
            {keys.map((key) => {
              const value = values[key] ?? "";
              const multiline = value.length > 80 || value.includes("\n") || key.includes("datos_sesion") || key === "asunto";
              return (
                <div key={key}>
                  <label className="mb-1 block text-xs font-semibold text-ink">
                    {FIELD_LABELS[key] ?? key.replaceAll("_", " ")}
                  </label>
                  <div className="mb-1 font-mono text-[10px] text-muted-foreground">{`{${key}}`}</div>
                  {multiline ? (
                    <Textarea
                      value={value}
                      onChange={(event) => setValues((current) => applyFieldChange(current, key, event.target.value))}
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={value}
                      onChange={(event) => setValues((current) => applyFieldChange(current, key, event.target.value))}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-secondary/30">
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-wine-900">
              <Eye className="size-4" /> Vista previa del documento
            </div>
            {dirty && (
              <span className="rounded-full bg-accent/15 px-2 py-1 text-[11px] font-semibold text-wine-900">
                Cambios sin refrescar pueden estar pendientes
              </span>
            )}
          </div>
          <div className="relative min-h-[650px] max-h-[75vh] overflow-auto bg-neutral-200 p-5">
            {rendering && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm font-semibold text-muted-foreground backdrop-blur-[1px]">
                <Loader2 className="mr-2 size-5 animate-spin" /> Renderizando Word…
              </div>
            )}
            <div
              ref={previewRef}
              className="mx-auto min-h-[600px] [&_.docx-wrapper]:!bg-transparent [&_.docx-wrapper>section.docx]:!shadow-lg"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
