import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { Modal } from "./ui/modal";
import { Input, Textarea, Label } from "./ui/input";
import { Button } from "./ui/button";
import { CreatableCombobox, YesNoSegmented } from "./creatable-combobox";
import { useCreateRecord, useUpdateRecord } from "../queries/records";
import {
  useOptions,
  useRemoveOptionByValue,
  type OptionField,
} from "../queries/options";
import { cn } from "@/lib/utils";

type FormState = {
  fechaRecepcionOficialia: string;
  horaRecepcion: string;
  fechaHoraRecepcionDcc: string;
  medioRecepcion: string;
  volanteOficialia: string;
  numeroOficioEnte: string;
  signadoPor: string;
  cargoPuesto: string;
  asunto: string;
  ente: string;
  organoColegiado: string;
  fechaHoraSesion: string;
  numeroSesion: string;
  tipoSesion: string;
  carpetaTrabajo: string;
  sesionVirtualPresencial: string;
  sesionVirtualDetalle: string;
  consecutivoFolio: string;
  firma: string;
  elaboradoPor: string;
  personaContralora: string;
  personaContraloraSuplente: string;
  ccep: string;
  reporteActividadesEstado: string;
};

const FIRMA_DEFAULTS = ["LMD", "MDCT", "MAPG", "SYOM", "ACP"];
const ELABORADO_POR_OPTIONS = [
  "José Alberto Sahagún Pérez",
  "José de Jesús Martell Monroy",
] as const;

const empty: FormState = {
  fechaRecepcionOficialia: "",
  horaRecepcion: "",
  fechaHoraRecepcionDcc: "",
  medioRecepcion: "",
  volanteOficialia: "",
  numeroOficioEnte: "",
  signadoPor: "",
  cargoPuesto: "",
  asunto: "",
  ente: "",
  organoColegiado: "",
  fechaHoraSesion: "",
  numeroSesion: "",
  tipoSesion: "",
  carpetaTrabajo: "No",
  sesionVirtualPresencial: "No",
  sesionVirtualDetalle: "",
  consecutivoFolio: "",
  firma: "",
  elaboradoPor: "",
  personaContralora: "",
  personaContraloraSuplente: "",
  ccep: "",
  reporteActividadesEstado: "",
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function fromRecord(r: Record<string, unknown> | null): FormState {
  if (!r) return { ...empty };
  const g = (k: string) => (r[k] == null ? "" : String(r[k]));
  return {
    fechaRecepcionOficialia: g("fechaRecepcionOficialia"),
    horaRecepcion: g("horaRecepcion"),
    fechaHoraRecepcionDcc: g("fechaHoraRecepcionDcc"),
    medioRecepcion: g("medioRecepcion"),
    volanteOficialia: g("volanteOficialia"),
    numeroOficioEnte: g("numeroOficioEnte"),
    signadoPor: g("signadoPor"),
    cargoPuesto: g("cargoPuesto"),
    asunto: g("asunto"),
    ente: g("ente"),
    organoColegiado: g("organoColegiado"),
    fechaHoraSesion: g("fechaHoraSesion"),
    numeroSesion: g("numeroSesion"),
    tipoSesion: g("tipoSesion"),
    carpetaTrabajo: g("carpetaTrabajo") || "No",
    sesionVirtualPresencial: g("sesionVirtualPresencial") || "No",
    sesionVirtualDetalle: g("sesionVirtualDetalle"),
    consecutivoFolio: g("consecutivoFolio"),
    firma: g("firma"),
    elaboradoPor: g("elaboradoPor"),
    personaContralora: g("personaContralora"),
    personaContraloraSuplente: g("personaContraloraSuplente"),
    ccep: g("ccep"),
    reporteActividadesEstado: g("reporteActividadesEstado"),
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 border-b border-border pb-1.5 font-display text-sm font-semibold uppercase tracking-wider text-primary">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

export function RecordForm({
  open,
  onClose,
  record,
}: {
  open: boolean;
  onClose: () => void;
  record: Record<string, unknown> | null;
}) {
  const [form, setForm] = React.useState<FormState>(empty);
  const options = useOptions();
  const removeOption = useRemoveOptionByValue();
  const create = useCreateRecord();
  const update = useUpdateRecord();
  const isEdit = !!record?.id;

  React.useEffect(() => {
    if (open) setForm(fromRecord(record));
  }, [open, record]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const opt = (field: string) => (options.data?.[field] as string[] | undefined) ?? [];
  const deleteSuggestion = (field: OptionField) => (value: string) =>
    removeOption.mutateAsync({ field, value });

  const isExtemporaneo = normalizeText(form.asunto) === "extemporaneo";
  const isConvocatoria = normalizeText(form.asunto) === "convocatoria";

  const submit = async () => {
    const payload = {
      ...form,
      sesionVirtualDetalle:
        form.sesionVirtualPresencial === "Sí" ? form.sesionVirtualDetalle : "",
      ccep: isExtemporaneo ? form.ccep : "",
      reporteActividadesEstado: isConvocatoria ? form.reporteActividadesEstado : "",
    };
    if (isEdit) {
      await update.mutateAsync({ id: Number(record!.id), ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const saving = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Editar registro #${record?.consecutivo}` : "Nuevo registro"}
      subtitle="Los campos con lista permiten escribir o seleccionar. La X elimina una opción guardada del catálogo, sin modificar registros anteriores."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar
          </Button>
        </>
      }
    >
      <Section title="Recepción">
        <div>
          <Label>Consecutivo</Label>
          <Input value={isEdit ? String(record?.consecutivo) : "Automático"} disabled className="bg-secondary font-semibold" />
        </div>
        <div>
          <Label>Fecha de recepción oficialía</Label>
          <Input type="date" value={form.fechaRecepcionOficialia} onChange={(e) => set("fechaRecepcionOficialia", e.target.value)} />
        </div>
        <div>
          <Label>Hora de recepción</Label>
          <Input type="time" value={form.horaRecepcion} onChange={(e) => set("horaRecepcion", e.target.value)} />
        </div>
        <div>
          <Label>Hora de recepción DCC <span className="normal-case">(fecha y hora)</span></Label>
          <Input type="datetime-local" value={form.fechaHoraRecepcionDcc} onChange={(e) => set("fechaHoraRecepcionDcc", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Medio por el cual se recibió:</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Correo", "Oficialía", "Ambos"].map((medio) => {
              const active = form.medioRecepcion === medio;
              return (
                <button
                  key={medio}
                  type="button"
                  onClick={() => set("medioRecepcion", medio)}
                  className={cn(
                    "rounded-md border px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-white text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {medio}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <Label>Volante de Oficialía de Partes/Correo</Label>
          <Input value={form.volanteOficialia} onChange={(e) => set("volanteOficialia", e.target.value)} />
        </div>
        <div>
          <Label>Número de oficio ente</Label>
          <Input value={form.numeroOficioEnte} onChange={(e) => set("numeroOficioEnte", e.target.value)} />
        </div>
      </Section>

      <Section title="Firma / Origen">
        <div><Label>Signado por</Label><CreatableCombobox value={form.signadoPor} onChange={(v) => set("signadoPor", v)} suggestions={opt("signadoPor")} onDeleteSuggestion={deleteSuggestion("signadoPor")} /></div>
        <div><Label>Cargo / Puesto</Label><CreatableCombobox value={form.cargoPuesto} onChange={(v) => set("cargoPuesto", v)} suggestions={opt("cargoPuesto")} onDeleteSuggestion={deleteSuggestion("cargoPuesto")} /></div>
        <div><Label>Asunto</Label><CreatableCombobox value={form.asunto} onChange={(v) => set("asunto", v)} suggestions={opt("asunto")} onDeleteSuggestion={deleteSuggestion("asunto")} /></div>
        <div><Label>Ente</Label><CreatableCombobox value={form.ente} onChange={(v) => set("ente", v)} suggestions={opt("ente")} onDeleteSuggestion={deleteSuggestion("ente")} /></div>
      </Section>

      <Section title="Sesión">
        <div><Label>Nombre de Órgano Colegiado</Label><CreatableCombobox value={form.organoColegiado} onChange={(v) => set("organoColegiado", v)} suggestions={opt("organoColegiado")} onDeleteSuggestion={deleteSuggestion("organoColegiado")} /></div>
        <div><Label>Fecha y hora de la sesión</Label><Input type="datetime-local" value={form.fechaHoraSesion} onChange={(e) => set("fechaHoraSesion", e.target.value)} /></div>
        <div><Label>Número de la sesión</Label><Input value={form.numeroSesion} onChange={(e) => set("numeroSesion", e.target.value)} placeholder="Ej. 03" /></div>
        <div><Label>Tipo de sesión</Label><CreatableCombobox value={form.tipoSesion} onChange={(v) => set("tipoSesion", v)} suggestions={opt("tipoSesion")} onDeleteSuggestion={deleteSuggestion("tipoSesion")} /></div>
        <div><Label>Persona contralora ciudadana convocada</Label><CreatableCombobox value={form.personaContralora} onChange={(v) => set("personaContralora", v)} suggestions={opt("personaContralora")} onDeleteSuggestion={deleteSuggestion("personaContralora")} /></div>
        <div><Label>Persona contralora ciudadana suplente</Label><CreatableCombobox value={form.personaContraloraSuplente} onChange={(v) => set("personaContraloraSuplente", v)} suggestions={opt("personaContraloraSuplente")} onDeleteSuggestion={deleteSuggestion("personaContraloraSuplente")} /></div>
        <div><Label>Carpeta de trabajo</Label><YesNoSegmented value={form.carpetaTrabajo} onChange={(v) => set("carpetaTrabajo", v)} /></div>
        <div>
          <Label>Datos sesión virtual / presencial</Label>
          <YesNoSegmented value={form.sesionVirtualPresencial} onChange={(v) => set("sesionVirtualPresencial", v)} />
          {form.sesionVirtualPresencial === "Sí" && (
            <div className="mt-3 animate-rise">
              <Label>Datos de la sesión:</Label>
              <Textarea placeholder="Escribe aquí los datos de la sesión…" value={form.sesionVirtualDetalle} onChange={(e) => set("sesionVirtualDetalle", e.target.value)} />
            </div>
          )}
        </div>
      </Section>

      <Section title="Folio">
        <div><Label>Consecutivo folio (SCG/DCC/CE/----/2026)</Label><Input value={form.consecutivoFolio} onChange={(e) => set("consecutivoFolio", e.target.value)} placeholder="SCG/DCC/CE/----/2026" /></div>
        <div><Label>Firma</Label><CreatableCombobox value={form.firma} onChange={(v) => set("firma", v)} suggestions={opt("firma")} onDeleteSuggestion={deleteSuggestion("firma")} nonDeletableSuggestions={FIRMA_DEFAULTS} /></div>
        <div className="md:col-span-2">
          <Label>Elaborado por</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ELABORADO_POR_OPTIONS.map((persona) => {
              const active = form.elaboradoPor === persona;
              return (
                <button
                  key={persona}
                  type="button"
                  onClick={() => set("elaboradoPor", persona)}
                  className={cn(
                    "rounded-md border px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-white text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {persona}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {isExtemporaneo && (
        <Section title="C.C.E.P.">
          <div className="md:col-span-2">
            <Label>C.C.E.P.</Label>
            <CreatableCombobox value={form.ccep} onChange={(v) => set("ccep", v)} suggestions={opt("ccep")} onDeleteSuggestion={deleteSuggestion("ccep")} placeholder="Escribe o selecciona C.C.E.P.…" />
          </div>
        </Section>
      )}

      {isConvocatoria && (
        <Section title="Seguimiento">
          <div className="md:col-span-2">
            <Label>Entrega de reporte de Actividades</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["entregado", "no entregado"].map((estado) => {
                const active = form.reporteActividadesEstado === estado;
                return (
                  <button
                    key={estado}
                    type="button"
                    onClick={() => set("reporteActividadesEstado", estado)}
                    className={cn(
                      "rounded-md border px-4 py-2 text-sm font-semibold transition-colors",
                      active
                        ? estado === "entregado"
                          ? "border-green-700 bg-green-700 text-white"
                          : "border-red-700 bg-red-700 text-white"
                        : "border-input bg-white text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {estado === "entregado" ? "Entregado" : "No entregado"}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Si permanece pendiente, el sistema seleccionará automáticamente “No entregado” al vencer 5 días hábiles desde la fecha y hora de la sesión, usando horario de Ciudad de México.
            </p>
          </div>
        </Section>
      )}
    </Modal>
  );
}
