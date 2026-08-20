import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { TEMPLATES_DIR } from "./storage";
import { buildTemplateData } from "./records";

export type TemplateOverrides = Record<string, string>;

// Genera un .docx a partir de una plantilla almacenada y un registro.
// Las etiquetas en la plantilla usan la sintaxis {etiqueta}.
// Los overrides sustituyen únicamente los valores de las etiquetas; el formato
// (fuente, tamaño, negritas, alineación, etc.) sigue perteneciendo a la plantilla.
export function renderDocx(
  storedFilename: string,
  record: Record<string, unknown>,
  overrides: TemplateOverrides = {},
): Buffer {
  const path = resolve(TEMPLATES_DIR, storedFilename);
  const content = readFileSync(path, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },
    nullGetter: () => "",
  });

  const baseData = buildTemplateData(record);
  const safeOverrides = Object.fromEntries(
    Object.entries(overrides).map(([key, value]) => [key, String(value ?? "")]),
  );

  doc.render({ ...baseData, ...safeOverrides });
  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
