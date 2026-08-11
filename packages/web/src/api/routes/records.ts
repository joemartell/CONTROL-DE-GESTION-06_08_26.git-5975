import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { OPTION_FIELDS, type OptionField } from "../lib/records";
import { ORPCError } from "@orpc/server";

const recordFields = z.object({
  fechaRecepcionOficialia: z.string().nullable().optional(),
  horaRecepcion: z.string().nullable().optional(),
  fechaHoraRecepcionDcc: z.string().nullable().optional(),
  volanteOficialia: z.string().nullable().optional(),
  numeroOficioEnte: z.string().nullable().optional(),
  signadoPor: z.string().nullable().optional(),
  cargoPuesto: z.string().nullable().optional(),
  asunto: z.string().nullable().optional(),
  ente: z.string().nullable().optional(),
  organoColegiado: z.string().nullable().optional(),
  fechaHoraSesion: z.string().nullable().optional(),
  numeroSesion: z.string().nullable().optional(),
  tipoSesion: z.string().nullable().optional(),
  carpetaTrabajo: z.string().nullable().optional(),
  sesionVirtualPresencial: z.string().nullable().optional(),
  sesionVirtualDetalle: z.string().nullable().optional(),
  consecutivoFolio: z.string().nullable().optional(),
  firma: z.string().nullable().optional(),
  personaContralora: z.string().nullable().optional(),
  personaContraloraSuplente: z.string().nullable().optional(),
  ccep: z.string().nullable().optional(),
});

type RecordFields = z.infer<typeof recordFields>;

function deriveMonthYear(fecha: string | null | undefined) {
  const d = fecha ? new Date(fecha.length <= 10 ? fecha + "T00:00:00" : fecha) : new Date();
  const valid = isNaN(d.getTime()) ? new Date() : d;
  return { mes: valid.getMonth() + 1, anio: valid.getFullYear() };
}

function isExtemporaneo(asunto: string | null | undefined): boolean {
  return (asunto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase() === "extemporaneo";
}

function sanitizeConditionalFields(fields: RecordFields): RecordFields {
  return {
    ...fields,
    ccep: isExtemporaneo(fields.asunto) ? fields.ccep : "",
  };
}

async function learnOptions(fields: RecordFields) {
  const map: Partial<Record<OptionField, string | null | undefined>> = {
    asunto: fields.asunto,
    ente: fields.ente,
    signadoPor: fields.signadoPor,
    cargoPuesto: fields.cargoPuesto,
    organoColegiado: fields.organoColegiado,
    tipoSesion: fields.tipoSesion,
    personaContralora: fields.personaContralora,
    personaContraloraSuplente: fields.personaContraloraSuplente,
    firma: fields.firma,
    ccep: fields.ccep,
  };
  for (const field of OPTION_FIELDS) {
    const value = (map[field] ?? "").trim();
    if (!value) continue;
    const existing = await db
      .select()
      .from(schema.options)
      .where(and(eq(schema.options.field, field), eq(schema.options.value, value)));
    if (existing.length === 0) {
      await db.insert(schema.options).values({ field, value });
    }
  }
}

export const records = {
  listByYear: base
    .input(z.object({ anio: z.number() }))
    .handler(({ input }) =>
      db
        .select()
        .from(schema.records)
        .where(eq(schema.records.anio, input.anio))
        .orderBy(desc(schema.records.consecutivo)),
    ),

  // Registros de un mes y año para generar informes mensuales.
  listByMonth: base
    .input(z.object({ anio: z.number(), mes: z.number().min(1).max(12) }))
    .handler(({ input }) =>
      db
        .select()
        .from(schema.records)
        .where(
          and(
            eq(schema.records.anio, input.anio),
            eq(schema.records.mes, input.mes),
          ),
        )
        .orderBy(desc(schema.records.consecutivo)),
    ),

  // Consolidado completo de todos los años y meses.
  listAll: base.handler(() =>
    db
      .select()
      .from(schema.records)
      .orderBy(
        desc(schema.records.anio),
        desc(schema.records.mes),
        desc(schema.records.consecutivo),
      ),
  ),

  years: base.handler(async () => {
    const rows = await db
      .select({ anio: schema.records.anio })
      .from(schema.records)
      .groupBy(schema.records.anio)
      .orderBy(desc(schema.records.anio));
    return rows.map((r) => r.anio);
  }),

  get: base
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [row] = await db
        .select()
        .from(schema.records)
        .where(eq(schema.records.id, input.id));
      if (!row) throw new ORPCError("NOT_FOUND", { message: "Registro no encontrado" });
      return row;
    }),

  create: base
    .input(recordFields)
    .handler(async ({ input }) => {
      const fields = sanitizeConditionalFields(input);
      const { mes, anio } = deriveMonthYear(fields.fechaRecepcionOficialia);
      const [{ maxc }] = await db
        .select({ maxc: sql<number>`coalesce(max(${schema.records.consecutivo}), 0)` })
        .from(schema.records);
      const [row] = await db
        .insert(schema.records)
        .values({ ...fields, mes, anio, consecutivo: (maxc ?? 0) + 1 })
        .returning();
      await learnOptions(fields);
      return row;
    }),

  update: base
    .input(recordFields.extend({ id: z.number() }))
    .handler(async ({ input }) => {
      const { id, ...rawFields } = input;
      const fields = sanitizeConditionalFields(rawFields);
      const { mes, anio } = deriveMonthYear(fields.fechaRecepcionOficialia);
      const [row] = await db
        .update(schema.records)
        .set({ ...fields, mes, anio, updatedAt: new Date() })
        .where(eq(schema.records.id, id))
        .returning();
      if (!row) throw new ORPCError("NOT_FOUND", { message: "Registro no encontrado" });
      await learnOptions(fields);
      return row;
    }),

  remove: base
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.records).where(eq(schema.records.id, input.id));
      return { ok: true };
    }),
};
