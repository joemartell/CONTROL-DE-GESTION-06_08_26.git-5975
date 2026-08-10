import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { ORPCError } from "@orpc/server";
import {
  RULE_KEYS,
  RULE_LABELS,
  resolveRuleKey,
  eligePlantilla,
  normalizaFirma,
  FIRMA_DEFAULTS,
  type RuleKey,
} from "../lib/records";
import { TEMPLATES_DIR } from "../lib/storage";

export const templates = {
  list: base.handler(() =>
    db.select().from(schema.templates).orderBy(asc(schema.templates.name)),
  ),

  // Estado de los slots por regla. Cada regla tiene una plantilla general
  // (sin firma) y, opcionalmente, una plantilla distinta por cada firma.
  slots: base.handler(async () => {
    const rows = await db.select().from(schema.templates);

    // Firmas conocidas: las precargadas + las que ya se usan en registros o plantillas.
    const usadas = new Set<string>(FIRMA_DEFAULTS.map((f) => f));
    for (const t of rows) {
      const f = normalizaFirma(t.firma);
      if (f) usadas.add(f);
    }
    const enRegistros = await db
      .selectDistinct({ firma: schema.records.firma })
      .from(schema.records);
    for (const r of enRegistros) {
      const f = normalizaFirma(r.firma);
      if (f) usadas.add(f);
    }
    const firmas = [...usadas].sort((a, b) => a.localeCompare(b, "es"));

    return RULE_KEYS.map((key) => {
      const deLaRegla = rows.filter((r) => r.ruleKey === key);
      return {
        ruleKey: key,
        label: RULE_LABELS[key],
        // Plantilla general de la regla (se usa cuando la firma no tiene una propia)
        template: deLaRegla.find((r) => !normalizaFirma(r.firma)) ?? null,
        // Una entrada por firma: qué plantilla usa cada firma en esta regla
        porFirma: firmas.map((f) => ({
          firma: f,
          template: deLaRegla.find((r) => normalizaFirma(r.firma) === f) ?? null,
        })),
      };
    });
  }),

  // Lista de firmas conocidas (para los selectores de la pantalla Plantillas)
  firmas: base.handler(async () => {
    const set = new Set<string>(FIRMA_DEFAULTS.map((f) => f));
    const [tpls, recs] = await Promise.all([
      db.select({ firma: schema.templates.firma }).from(schema.templates),
      db.selectDistinct({ firma: schema.records.firma }).from(schema.records),
    ]);
    for (const r of [...tpls, ...recs]) {
      const f = normalizaFirma(r.firma);
      if (f) set.add(f);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }),

  // Determina qué plantilla corresponde a un registro. Si ninguna regla aplica
  // o el slot está vacío, needsChoice = true (la UI pregunta cuál usar).
  resolveForRecord: base
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [rec] = await db
        .select()
        .from(schema.records)
        .where(eq(schema.records.id, input.id));
      if (!rec) throw new ORPCError("NOT_FOUND", { message: "Registro no encontrado" });
      const ruleKey = resolveRuleKey(rec);
      const rows = await db.select().from(schema.templates);
      const { template, matchedBy } = eligePlantilla(rows, ruleKey, rec.firma);
      return {
        ruleKey,
        ruleLabel: ruleKey ? RULE_LABELS[ruleKey] : null,
        firma: normalizaFirma(rec.firma),
        // "regla_y_firma" = plantilla específica de esa firma
        // "regla"         = plantilla general de la regla (la firma no tiene una propia)
        matchedBy,
        template,
        needsChoice: !template,
        allTemplates: rows,
      };
    }),

  remove: base
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [row] = await db
        .select()
        .from(schema.templates)
        .where(eq(schema.templates.id, input.id));
      if (row) {
        const path = resolve(TEMPLATES_DIR, row.storedFilename);
        if (existsSync(path)) rmSync(path);
        await db.delete(schema.templates).where(eq(schema.templates.id, input.id));
      }
      return { ok: true };
    }),

  // Reasigna (o limpia) la regla y/o la firma de una plantilla existente.
  // El slot es la pareja (regla, firma): solo una plantilla puede ocuparlo.
  setRule: base
    .input(
      z.object({
        id: z.number(),
        ruleKey: z.enum(RULE_KEYS).nullable(),
        firma: z.string().nullable().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const firma = input.ruleKey ? normalizaFirma(input.firma) : null;

      if (input.ruleKey) {
        // Liberar la plantilla que ya ocupaba este mismo slot (misma regla + misma firma).
        const ocupantes = await db
          .select()
          .from(schema.templates)
          .where(eq(schema.templates.ruleKey, input.ruleKey as RuleKey));
        for (const o of ocupantes) {
          if (o.id !== input.id && normalizaFirma(o.firma) === firma) {
            await db
              .update(schema.templates)
              .set({ ruleKey: null, firma: null })
              .where(eq(schema.templates.id, o.id));
          }
        }
      }

      const [row] = await db
        .update(schema.templates)
        .set({ ruleKey: input.ruleKey, firma })
        .where(eq(schema.templates.id, input.id))
        .returning();
      return row;
    }),
};
