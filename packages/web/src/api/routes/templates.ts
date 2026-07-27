import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { ORPCError } from "@orpc/server";
import { RULE_KEYS, RULE_LABELS, resolveRuleKey, type RuleKey } from "../lib/records";
import { TEMPLATES_DIR } from "../lib/storage";

export const templates = {
  list: base.handler(() =>
    db.select().from(schema.templates).orderBy(asc(schema.templates.name)),
  ),

  // Estado de los 5 slots por reglas: qué plantilla ocupa cada uno
  slots: base.handler(async () => {
    const rows = await db.select().from(schema.templates);
    return RULE_KEYS.map((key) => ({
      ruleKey: key,
      label: RULE_LABELS[key],
      template: rows.find((r) => r.ruleKey === key) ?? null,
    }));
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
      const matched = ruleKey ? rows.find((r) => r.ruleKey === ruleKey) ?? null : null;
      return {
        ruleKey,
        ruleLabel: ruleKey ? RULE_LABELS[ruleKey] : null,
        template: matched,
        needsChoice: !matched,
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

  // Reasigna (o limpia) el slot por reglas de una plantilla existente.
  setRule: base
    .input(z.object({ id: z.number(), ruleKey: z.enum(RULE_KEYS).nullable() }))
    .handler(async ({ input }) => {
      // Un slot solo puede tener una plantilla: liberar cualquier otra que lo ocupe.
      if (input.ruleKey) {
        await db
          .update(schema.templates)
          .set({ ruleKey: null })
          .where(eq(schema.templates.ruleKey, input.ruleKey as RuleKey));
      }
      const [row] = await db
        .update(schema.templates)
        .set({ ruleKey: input.ruleKey })
        .where(eq(schema.templates.id, input.id))
        .returning();
      return row;
    }),
};
