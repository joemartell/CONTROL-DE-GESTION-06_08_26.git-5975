import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";

// packages/web/src/api/lib/storage.ts -> raíz del proyecto (5 niveles arriba)
const here = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(here, "../../../../..");

export const DATA_DIR = resolve(PROJECT_ROOT, "datos");
export const TEMPLATES_DIR = resolve(DATA_DIR, "plantillas");
export const OUTPUT_DIR = resolve(DATA_DIR, "impresiones");
export const DB_DIR = resolve(DATA_DIR, "base-de-datos");

export function ensureDirs() {
  for (const dir of [DATA_DIR, TEMPLATES_DIR, OUTPUT_DIR, DB_DIR]) {
    mkdirSync(dir, { recursive: true });
  }
}

ensureDirs();
