import { defineConfig } from "drizzle-kit";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Ruta absoluta a <raíz-del-proyecto>/datos/base-de-datos/registros.db,
// calculada desde la ubicación de este archivo (packages/web).
// Así funciona igual en Windows, macOS y Linux, y aunque falte el .env.
const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..", "..");
const localDbFile = path.join(projectRoot, "datos", "base-de-datos", "registros.db");

const envUrl = process.env.DATABASE_URL?.trim();
const url = envUrl && envUrl.length > 0 ? envUrl : `file:${localDbFile}`;

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: { url },
  schema: "./src/api/database/schema.ts",
  out: "./drizzle",
});
