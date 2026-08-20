import type { RouterClient } from "@orpc/server";
import { randomUUID } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { createApp } from "./__core/app";
import { ping } from "./routes/ping";
import { records } from "./routes/records";
import { options } from "./routes/options";
import { templates } from "./routes/templates";
import { db } from "./database";
import * as schema from "./database/schema";
import { eq } from "drizzle-orm";
import { TEMPLATES_DIR } from "./lib/storage";
import { renderDocx, type TemplateOverrides } from "./lib/docx";
import { RULE_KEYS, normalizaFirma, buildTemplateData } from "./lib/records";

export const router = {
  ping,
  records,
  options,
  templates,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Cargar una plantilla .docx (multipart). Campos: file, name, ruleKey?
app.post("/api/templates/upload", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  const name = String(form.get("name") ?? "").trim();
  const ruleKeyRaw = String(form.get("ruleKey") ?? "").trim();
  const ruleKey = RULE_KEYS.includes(ruleKeyRaw as never) ? ruleKeyRaw : null;
  // La firma solo aplica junto con una regla: (regla + firma) = plantilla específica.
  const firma = ruleKey ? normalizaFirma(String(form.get("firma") ?? "")) : null;

  if (!(file instanceof File)) {
    return c.json({ error: "Falta el archivo .docx" }, 400);
  }
  if (extname(file.name).toLowerCase() !== ".docx") {
    return c.json({ error: "El archivo debe ser .docx" }, 400);
  }

  const storedFilename = `${randomUUID()}.docx`;
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(resolve(TEMPLATES_DIR, storedFilename), buffer);

  // Si se asigna a un slot (regla + firma), liberar la plantilla previa de ESE slot.
  if (ruleKey) {
    const ocupantes = await db
      .select()
      .from(schema.templates)
      .where(eq(schema.templates.ruleKey, ruleKey));
    for (const o of ocupantes) {
      if (normalizaFirma(o.firma) === firma) {
        await db
          .update(schema.templates)
          .set({ ruleKey: null, firma: null })
          .where(eq(schema.templates.id, o.id));
      }
    }
  }

  const [row] = await db
    .insert(schema.templates)
    .values({
      ruleKey,
      firma,
      name: name || file.name.replace(/\.docx$/i, ""),
      storedFilename,
      originalName: file.name,
    })
    .returning();
  return c.json(row, 200);
});

function safeFilename(record: typeof schema.records.$inferSelect) {
  const safeAsunto = (record.asunto ?? "registro")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .slice(0, 40);
  return `registro-${record.consecutivo}-${safeAsunto}.docx`;
}

function toResponseBody(buffer: Buffer): Uint8Array {
  const body = new Uint8Array(buffer.byteLength);
  body.set(buffer);
  return body;
}

function sanitizeOverrides(value: unknown): TemplateOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => /^[a-zA-Z0-9_]+$/.test(key))
    .slice(0, 250)
    .map(([key, item]) => [key, String(item ?? "").slice(0, 20000)] as const);
  return Object.fromEntries(entries);
}

async function loadPrintContext(id: number, templateId: number) {
  if (!id || !templateId) return { error: "Parámetros inválidos", status: 400 as const };

  const [rec] = await db.select().from(schema.records).where(eq(schema.records.id, id));
  if (!rec) return { error: "Registro no encontrado", status: 404 as const };

  const [tpl] = await db
    .select()
    .from(schema.templates)
    .where(eq(schema.templates.id, templateId));
  if (!tpl) return { error: "Plantilla no encontrada", status: 404 as const };

  if (!existsSync(resolve(TEMPLATES_DIR, tpl.storedFilename))) {
    return { error: "El archivo de la plantilla no existe", status: 404 as const };
  }

  return { rec, tpl, filename: safeFilename(rec) };
}

// Datos editables que alimentan las etiquetas de la plantilla.
app.get("/api/records/:id/print-data", async (c) => {
  const id = Number(c.req.param("id"));
  const templateId = Number(c.req.query("templateId"));
  const context = await loadPrintContext(id, templateId);
  if ("error" in context) return c.json({ error: context.error }, context.status);

  return c.json({
    filename: context.filename,
    templateName: context.tpl.name,
    data: buildTemplateData(context.rec),
  });
});

// Vista previa: genera el mismo DOCX que se descargará, pero como respuesta inline.
app.post("/api/records/:id/print-preview", async (c) => {
  const id = Number(c.req.param("id"));
  const templateId = Number(c.req.query("templateId"));
  const context = await loadPrintContext(id, templateId);
  if ("error" in context) return c.json({ error: context.error }, context.status);

  const payload = await c.req.json().catch(() => ({}));
  const overrides = sanitizeOverrides((payload as { overrides?: unknown }).overrides);

  try {
    const buffer = renderDocx(context.tpl.storedFilename, context.rec, overrides);
    return new Response(toResponseBody(buffer), {
      status: 200,
      headers: {
        "Content-Type": DOCX_MIME,
        "Content-Disposition": `inline; filename="${context.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return c.json(
      { error: "No se pudo generar la vista previa. Revisa las etiquetas de la plantilla.", detail: String(err) },
      500,
    );
  }
});

// Imprimir clásico: descarga directa sin modificaciones.
app.get("/api/records/:id/print", async (c) => {
  const id = Number(c.req.param("id"));
  const templateId = Number(c.req.query("templateId"));
  const context = await loadPrintContext(id, templateId);
  if ("error" in context) return c.json({ error: context.error }, context.status);

  try {
    const buffer = renderDocx(context.tpl.storedFilename, context.rec);
    return new Response(toResponseBody(buffer), {
      status: 200,
      headers: {
        "Content-Type": DOCX_MIME,
        "Content-Disposition": `attachment; filename="${context.filename}"`,
      },
    });
  } catch (err) {
    return c.json(
      { error: "No se pudo generar el documento. Revisa las etiquetas de la plantilla.", detail: String(err) },
      500,
    );
  }
});

// Descarga editada: regenera desde la plantilla original aplicando los cambios de texto.
app.post("/api/records/:id/print", async (c) => {
  const id = Number(c.req.param("id"));
  const templateId = Number(c.req.query("templateId"));
  const context = await loadPrintContext(id, templateId);
  if ("error" in context) return c.json({ error: context.error }, context.status);

  const payload = await c.req.json().catch(() => ({}));
  const overrides = sanitizeOverrides((payload as { overrides?: unknown }).overrides);

  try {
    const buffer = renderDocx(context.tpl.storedFilename, context.rec, overrides);
    return new Response(toResponseBody(buffer), {
      status: 200,
      headers: {
        "Content-Type": DOCX_MIME,
        "Content-Disposition": `attachment; filename="${context.filename}"`,
      },
    });
  } catch (err) {
    return c.json(
      { error: "No se pudo generar el documento editado. Revisa las etiquetas de la plantilla.", detail: String(err) },
      500,
    );
  }
});

export default app;
