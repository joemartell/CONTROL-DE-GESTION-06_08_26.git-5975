import { Layout } from "../components/layout";
import { FileText, FolderTree, Printer, Tags, Type } from "lucide-react";

const BASE_TAGS: [string, string][] = [
  ["{consecutivo}", "Número consecutivo automático"],
  ["{mes}", "Mes en texto (Enero…Diciembre)"],
  ["{anio}", "Año"],
  ["{fecha_recepcion_oficialia}", "Fecha de recepción oficialía"],
  ["{hora_recepcion}", "Hora de recepción"],
  ["{fecha_hora_recepcion_dcc}", "Fecha y hora de recepción DCC"],
  ["{volante_oficialia}", "Volante de Oficialía/Correo"],
  ["{numero_oficio_ente}", "Número de oficio ente"],
  ["{signado_por}", "Signado por"],
  ["{cargo_puesto}", "Cargo / Puesto"],
  ["{asunto}", "Asunto"],
  ["{ente}", "Ente"],
  ["{organo_colegiado}", "Nombre de Órgano Colegiado"],
  ["{fecha_hora_sesion}", "Fecha y hora de la sesión"],
  ["{numero_sesion}", "Número de la sesión"],
  ["{tipo_sesion}", "Tipo de sesión"],
  ["{carpeta_trabajo}", "Carpeta de trabajo (Sí/No)"],
  ["{sesion_virtual_presencial}", "Sesión virtual/presencial (Sí/No)"],
  ["{datos_sesion}", "Datos de la sesión (texto libre cuando la opción es «Sí»)"],
  ["{sesion_virtual_detalle}", "Alias de {datos_sesion} (compatibilidad)"],
  ["{consecutivo_folio}", "Consecutivo folio SCG/DCC/CE/----/2026"],
  ["{firma}", "Firma (iniciales: LMD, MDCT, MAPG, SYOM, ACP)"],
  ["{persona_contralora}", "Persona contralora ciudadana convocada"],
  ["{fecha_impresion}", "Fecha en que se imprime el documento"],
];

const FORMATTABLE_TAGS: [string, string][] = [
  ["signado_por", "Signado por"],
  ["cargo_puesto", "Cargo / Puesto"],
  ["asunto", "Asunto"],
  ["ente", "Ente"],
  ["organo_colegiado", "Órgano Colegiado"],
  ["tipo_sesion", "Tipo de sesión"],
  ["datos_sesion", "Datos de la sesión"],
  ["sesion_virtual_detalle", "Alias de datos de la sesión"],
  ["persona_contralora", "Persona contralora ciudadana"],
];

const FORMAT_TAGS = FORMATTABLE_TAGS.flatMap<[string, string]>(([tag, desc]) => [
  [`{${tag}_mayusculas}`, `${desc} · MAYÚSCULAS`],
  [`{${tag}_minusculas}`, `${desc} · minúsculas`],
  [`{${tag}_intercalado}`, `${desc} · Intercalado / tipo título`],
]);

const TAGS: [string, string][] = [...BASE_TAGS, ...FORMAT_TAGS];

const RULES: [string, string][] = [
  ["ASUNTO = «Convocatoria»", "Plantilla de Convocatoria"],
  ["ASUNTO = «Extemporáneo»", "Plantilla de Extemporáneo"],
  ["Carpeta de trabajo = No  ·  Sesión virtual/presencial = Sí", "Plantilla específica 1"],
  ["Carpeta de trabajo = Sí  ·  Sesión virtual/presencial = No", "Plantilla específica 2"],
  ["Carpeta de trabajo = No  ·  Sesión virtual/presencial = No", "Plantilla específica 3"],
  ["Dentro de la regla: FIRMA con plantilla propia", "Esa plantilla (tiene prioridad)"],
  ["Dentro de la regla: FIRMA sin plantilla propia", "Plantilla general de la regla"],
  ["Cualquier otro caso", "La app pregunta cuál plantilla usar"],
];

function Card({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-6">
      <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold text-wine-900">
        <Icon className="size-5 text-primary" /> {title}
      </h2>
      <div className="text-sm leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export default function Ayuda() {
  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-8 py-8">
        <h1 className="mb-6 font-display text-4xl font-bold text-wine-900">Ayuda</h1>

        <Card icon={Printer} title="Cómo funciona la impresión">
          <p className="mb-2">
            Cada registro tiene el botón <b>Imprimir</b>. La app decide qué plantilla usar según estas reglas y descarga un nuevo <b>.docx</b> con los datos del registro:
          </p>
          <ol className="mb-3 list-decimal space-y-1 rounded-lg border border-accent/40 bg-accent/10 p-4 pl-8">
            <li>
              Busca una plantilla de la <b>misma regla y la misma FIRMA</b> del registro.
            </li>
            <li>
              Si esa firma no tiene plantilla propia, usa la <b>plantilla general</b> de la regla
              (la que se subió con «Todas las firmas»).
            </li>
            <li>Si no existe ninguna de las dos, la app <b>pregunta</b> cuál usar.</li>
          </ol>
          <p className="mb-2">
            Es decir: puedes tener una plantilla distinta por cada firma (LMD, MDCT, MAPG, SYOM, ACP)
            dentro de la misma regla. Se configuran en <b>Plantillas → Por firma</b>.
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-wine-900">
                <tr><th className="px-3 py-2">Condición</th><th className="px-3 py-2">Plantilla</th></tr>
              </thead>
              <tbody>
                {RULES.map(([c, p], i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2">{c}</td>
                    <td className="px-3 py-2 font-medium text-primary">{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card icon={FileText} title="Cómo preparar tu propia plantilla .docx">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Abre Microsoft Word (o LibreOffice) y crea tu documento con el formato oficial que necesites.</li>
            <li>
              Donde quieras que aparezca un dato, escribe la etiqueta correspondiente entre llaves, por ejemplo{" "}
              <code className="rounded bg-secondary px-1">{"{asunto}"}</code> o{" "}
              <code className="rounded bg-secondary px-1">{"{consecutivo_folio}"}</code>.
            </li>
            <li>Para controlar mayúsculas/minúsculas, usa una de las variantes explicadas abajo.</li>
            <li>Guarda el archivo en formato <b>.docx</b>.</li>
            <li>Entra a la pestaña <b>Plantillas</b>, pulsa <b>Subir plantilla</b>, elige el archivo y asígnalo a la regla que corresponda.</li>
            <li>Listo: al imprimir un registro, la app reemplaza cada etiqueta por su valor real.</li>
          </ol>
          <p className="mt-3 rounded-md bg-accent/10 p-3 text-[13px] text-wine-900">
            Consejo: escribe la etiqueta de un solo tirón (sin autocorrección que parta las llaves) para que Word no la divida internamente.
          </p>
        </Card>

        <Card icon={Type} title="Formatos de mayúsculas y minúsculas">
          <p className="mb-3">
            Los campos de texto principales pueden imprimirse en su valor original o con tres variantes. Solo cambia la etiqueta en Word; el valor guardado en la base de datos no se modifica.
          </p>
          <div className="mb-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-wine-900">
                <tr>
                  <th className="px-3 py-2">Formato</th>
                  <th className="px-3 py-2">Ejemplo para Signado por</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-3 py-2"><code>{"{signado_por_mayusculas}"}</code></td>
                  <td className="px-3 py-2">M.D. ERIKA ALEJANDRA BARBA LUNA</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2"><code>{"{signado_por_minusculas}"}</code></td>
                  <td className="px-3 py-2">m.d. erika alejandra barba luna</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2"><code>{"{signado_por_intercalado}"}</code></td>
                  <td className="px-3 py-2">M.D. Erika Alejandra Barba Luna</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">
            La variante <b>intercalado</b> usa estilo título en español: mantiene partículas como «de», «del», «la», «las», «los», «y», «en», «por» y «para» en minúscula y conserva acrónimos institucionales frecuentes.
          </p>
          <p className="text-xs text-muted-foreground">
            Ejemplo: <b>SECRETARÍA DE GESTIÓN INTEGRAL DE RIESGOS Y PROTECCIÓN CIVIL DE LA CIUDAD DE MÉXICO</b> se convierte en <b>Secretaría de Gestión Integral de Riesgos y Protección Civil de la Ciudad de México</b>.
          </p>
        </Card>

        <Card icon={Tags} title="Etiquetas disponibles">
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {TAGS.map(([tag, desc]) => (
              <div key={tag} className="flex items-baseline gap-2">
                <code className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold text-primary">{tag}</code>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card icon={FolderTree} title="Dónde se guardan los datos (uso local)">
          <p className="mb-2">Todo vive en tu equipo, dentro de la carpeta del proyecto:</p>
          <pre className="overflow-x-auto rounded-lg bg-wine-900 p-4 text-xs leading-relaxed text-[#f3e6d8]">{`registros-scg/
└─ datos/
   ├─ base-de-datos/
   │   └─ registros.db      ← base de datos (todos los registros)
   ├─ plantillas/           ← tus archivos .docx cargados
   └─ impresiones/          ← (opcional) documentos generados`}</pre>
          <p className="mt-3">
            Para respaldar tu información, copia la carpeta <b>datos/</b> completa. Para restaurar, reemplázala.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
