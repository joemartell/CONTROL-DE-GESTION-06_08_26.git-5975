import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { TEMPLATES_DIR } from "./storage";
import { buildTemplateData } from "./records";

// Genera un .docx a partir de una plantilla almacenada y un registro.
// Las etiquetas en la plantilla usan la sintaxis {etiqueta}.
export function renderDocx(storedFilename: string, record: Record<string, unknown>): Buffer {
  const path = resolve(TEMPLATES_DIR, storedFilename);
  const content = readFileSync(path, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },
    nullGetter: () => "",
  });
  doc.render(buildTemplateData(record));
  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
