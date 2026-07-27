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
import { renderDocx } from "./lib/docx";
import { RULE_KEYS } from "./lib/records";

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

  if (!(file instanceof File)) {
    return c.json({ error: "Falta el archivo .docx" }, 400);
  }
  if (extname(file.name).toLowerCase() !== ".docx") {
    return c.json({ error: "El archivo debe ser .docx" }, 400);
  }

  const storedFilename = `${randomUUID()}.docx`;
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(resolve(TEMPLATES_DIR, storedFilename), buffer);

  // Si se asigna a un slot por reglas, liberar la plantilla previa de ese slot.
  if (ruleKey) {
    await db
      .update(schema.templates)
      .set({ ruleKey: null })
      .where(eq(schema.templates.ruleKey, ruleKey));
  }

  const [row] = await db
    .insert(schema.templates)
    .values({
      ruleKey,
      name: name || file.name.replace(/\.docx$/i, ""),
      storedFilename,
      originalName: file.name,
    })
    .returning();
  return c.json(row, 200);
});

// Imprimir: genera y descarga el .docx del registro con la plantilla indicada.
app.get("/api/records/:id/print", async (c) => {
  const id = Number(c.req.param("id"));
  const templateId = Number(c.req.query("templateId"));
  if (!id || !templateId) {
    return c.json({ error: "Parámetros inválidos" }, 400);
  }
  const [rec] = await db.select().from(schema.records).where(eq(schema.records.id, id));
  if (!rec) return c.json({ error: "Registro no encontrado" }, 404);
  const [tpl] = await db
    .select()
    .from(schema.templates)
    .where(eq(schema.templates.id, templateId));
  if (!tpl) return c.json({ error: "Plantilla no encontrada" }, 404);
  if (!existsSync(resolve(TEMPLATES_DIR, tpl.storedFilename))) {
    return c.json({ error: "El archivo de la plantilla no existe" }, 404);
  }

  try {
    const buffer = renderDocx(tpl.storedFilename, rec);
    const safeAsunto = (rec.asunto ?? "registro")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .slice(0, 40);
    const filename = `registro-${rec.consecutivo}-${safeAsunto}.docx`;
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": DOCX_MIME,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return c.json(
      { error: "No se pudo generar el documento. Revisa las etiquetas de la plantilla.", detail: String(err) },
      500,
    );
  }
});

export default app;
