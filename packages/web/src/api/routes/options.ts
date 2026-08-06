import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { FIRMA_DEFAULTS, OPTION_FIELDS } from "../lib/records";

const fieldEnum = z.enum(OPTION_FIELDS);

export const options = {
  // Todas las opciones agrupadas por campo (para poblar los comboboxes)
  all: base.handler(async () => {
    const rows = await db
      .select()
      .from(schema.options)
      .orderBy(asc(schema.options.field), asc(schema.options.value));
    const grouped: Record<string, string[]> = {};
    for (const f of OPTION_FIELDS) grouped[f] = [];
    for (const row of rows) {
      (grouped[row.field] ??= []).push(row.value);
    }
    // Siglas de FIRMA siempre disponibles, aunque aún no existan registros.
    const firma = grouped.firma ?? [];
    for (const sigla of FIRMA_DEFAULTS) {
      if (!firma.includes(sigla)) firma.push(sigla);
    }
    grouped.firma = firma.sort((a, b) => a.localeCompare(b, "es"));
    return grouped;
  }),

  add: base
    .input(z.object({ field: fieldEnum, value: z.string().min(1) }))
    .handler(async ({ input }) => {
      const value = input.value.trim();
      const existing = await db
        .select()
        .from(schema.options)
        .where(and(eq(schema.options.field, input.field), eq(schema.options.value, value)));
      if (existing.length > 0) return existing[0];
      const [row] = await db
        .insert(schema.options)
        .values({ field: input.field, value })
        .returning();
      return row;
    }),

  remove: base
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.options).where(eq(schema.options.id, input.id));
      return { ok: true };
    }),
};
