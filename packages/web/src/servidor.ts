/**
 * Servidor de red para Registros SCG.
 *
 * Este archivo levanta UN solo servidor en el equipo "host". Los demás equipos
 * de la red entran por el navegador a la IP del host y todos guardan en la
 * MISMA base de datos (el archivo datos/base-de-datos/registros.db del host).
 *
 * Uso:  bun run servidor      (desde la raíz del proyecto)
 */
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";

// --- 1. Rutas absolutas ----------------------------------------------------
// packages/web/src/servidor.ts -> raíz del proyecto (3 niveles arriba)
const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..", "..", "..");
const dbPath = resolve(projectRoot, "datos", "base-de-datos", "registros.db");

mkdirSync(resolve(projectRoot, "datos", "base-de-datos"), { recursive: true });
mkdirSync(resolve(projectRoot, "datos", "plantillas"), { recursive: true });
mkdirSync(resolve(projectRoot, "datos", "impresiones"), { recursive: true });

// Forzamos una ruta absoluta ANTES de importar la base, para que el servidor
// funcione sin importar desde qué carpeta se ejecute y sin depender de .env.
process.env.DATABASE_URL = `file:${dbPath}`;
process.env.DATABASE_AUTH_TOKEN ??= "";

// --- 2. SQLite en modo WAL (varios equipos escribiendo a la vez) -----------
const { createClient } = await import("@libsql/client");
const pragmaClient = createClient({ url: process.env.DATABASE_URL });
await pragmaClient.execute("PRAGMA journal_mode = WAL");
await pragmaClient.execute("PRAGMA busy_timeout = 8000");
await pragmaClient.execute("PRAGMA synchronous = NORMAL");

// --- 3. La app (API + archivos estáticos) ----------------------------------
const { default: app } = await import("./api");

const distDir = resolve(here, "..", "dist");
const indexPath = resolve(distDir, "index.html");
const port = Number(process.env.PORT ?? 4200);

function staticPath(pathname: string) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, "").replaceAll("..", "");
  return clean ? resolve(distDir, clean) : indexPath;
}

const server = Bun.serve({
  port,
  hostname: "0.0.0.0", // <- visible para toda la red local
  idleTimeout: 120,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) return app.fetch(request);

    const file = Bun.file(staticPath(url.pathname));
    if (await file.exists()) return new Response(file);

    const index = Bun.file(indexPath);
    if (await index.exists()) {
      return new Response(index, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new Response(
      "No se encontró la compilación. Ejecuta primero: bun run build:web",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  },
});

// --- 4. Mostrar las direcciones para los demás equipos ---------------------
function direccionesLan(): string[] {
  const salida: string[] = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === "IPv4" && !net.internal) salida.push(net.address);
    }
  }
  return salida;
}

const ips = direccionesLan();
const linea = "=".repeat(58);
console.log(`\n${linea}`);
console.log("  REGISTROS SCG — Servidor de red iniciado");
console.log(linea);
console.log(`  En este equipo:      http://localhost:${server.port}`);
if (ips.length === 0) {
  console.log("  Sin red detectada: conecta el equipo a la red local.");
} else {
  console.log("  Desde los otros equipos de la misma red:");
  for (const ip of ips) console.log(`      ->  http://${ip}:${server.port}`);
}
console.log(`\n  Base de datos compartida:`);
console.log(`      ${dbPath}`);
console.log(`\n  Deja esta ventana abierta. Para detener: Ctrl + C`);
console.log(`${linea}\n`);
