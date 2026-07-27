import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Registros SCG — esquema de base de datos (SQLite local vía Drizzle).
 * Aplica cambios con `bun run db:push` desde packages/web.
 */

// Registro principal (oficialía de partes)
export const records = sqliteTable("records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  consecutivo: integer("consecutivo").notNull(),
  mes: integer("mes").notNull(), // 1..12 derivado de fecha_recepcion_oficialia
  anio: integer("anio").notNull(),

  fechaRecepcionOficialia: text("fecha_recepcion_oficialia"), // YYYY-MM-DD
  horaRecepcion: text("hora_recepcion"), // HH:mm
  fechaHoraRecepcionDcc: text("fecha_hora_recepcion_dcc"), // ISO datetime

  volanteOficialia: text("volante_oficialia"),
  numeroOficioEnte: text("numero_oficio_ente"),
  signadoPor: text("signado_por"),
  cargoPuesto: text("cargo_puesto"),

  asunto: text("asunto"),
  ente: text("ente"),
  organoColegiado: text("organo_colegiado"),
  fechaHoraSesion: text("fecha_hora_sesion"), // ISO datetime
  tipoSesion: text("tipo_sesion"),

  carpetaTrabajo: text("carpeta_trabajo"), // "Sí" | "No"
  sesionVirtualPresencial: text("sesion_virtual_presencial"), // "Sí" | "No"
  sesionVirtualDetalle: text("sesion_virtual_detalle"),

  consecutivoFolio: text("consecutivo_folio"),
  personaContralora: text("persona_contralora"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Opciones creables para los comboboxes ("escribe o selecciona")
export const options = sqliteTable("options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  field: text("field").notNull(), // asunto | ente | signadoPor | cargoPuesto | organoColegiado | tipoSesion | personaContralora
  value: text("value").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Plantillas .docx cargadas. ruleKey identifica la plantilla usada por reglas
// (convocatoria | extemporaneo | no_carpeta_si_virtual | si_carpeta_no_virtual | ambos_no).
// ruleKey = null => plantilla adicional de la biblioteca (elegible manualmente).
export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ruleKey: text("rule_key"),
  name: text("name").notNull(),
  storedFilename: text("stored_filename").notNull(),
  originalName: text("original_name").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
