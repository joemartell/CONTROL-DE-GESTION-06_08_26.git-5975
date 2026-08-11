import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { Modal } from "./ui/modal";
import { Input, Textarea, Label } from "./ui/input";
import { Button } from "./ui/button";
import { CreatableCombobox, YesNoSegmented } from "./creatable-combobox";
import { useCreateRecord, useUpdateRecord } from "../queries/records";
import { useOptions } from "../queries/options";

type FormState = {
  fechaRecepcionOficialia: string;
  horaRecepcion: string;
  fechaHoraRecepcionDcc: string;
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
  personaContralora: string;
  personaContraloraSuplente: string;
};

const empty: FormState = {
  fechaRecepcionOficialia: "",
  horaRecepcion: "",
  fechaHoraRecepcionDcc: "",
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
  personaContralora: "",
  personaContraloraSuplente: "",
};

function fromRecord(r: Record<string, unknown> | null): FormState {
  if (!r) return { ...empty };
  const g = (k: string) => (r[k] == null ? "" : String(r[k]));
  return {
    fechaRecepcionOficialia: g("fechaRecepcionOficialia"),
    horaRecepcion: g("horaRecepcion"),
    fechaHoraRecepcionDcc: g("fechaHoraRecepcionDcc"),
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
    personaContralora: g("personaContralora"),
    personaContraloraSuplente: g("personaContraloraSuplente"),
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
  const create = useCreateRecord();
  const update = useUpdateRecord();
  const isEdit = !!record?.id;

  React.useEffect(() => {
    if (open) setForm(fromRecord(record));
  }, [open, record]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const opt = (field: string) => (options.data?.[field] as string[] | undefined) ?? [];

  const submit = async () => {
    const payload = {
      ...form,
      sesionVirtualDetalle:
        form.sesionVirtualPresencial === "Sí" ? form.sesionVirtualDetalle : "",
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
      subtitle="Los campos marcados con lista permiten escribir o seleccionar y guardan lo nuevo."
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
          <Input
            value={isEdit ? String(record?.consecutivo) : "Automático"}
            disabled
            className="bg-secondary font-semibold"
          />
        </div>
        <div>
          <Label>Fecha de recepción oficialía</Label>
          <Input
            type="date"
            value={form.fechaRecepcionOficialia}
            onChange={(e) => set("fechaRecepcionOficialia", e.target.value)}
          />
        </div>
        <div>
          <Label>Hora de recepción</Label>
          <Input
            type="time"
            value={form.horaRecepcion}
            onChange={(e) => set("horaRecepcion", e.target.value)}
          />
        </div>
        <div>
          <Label>Hora de recepción DCC <span className="normal-case">(fecha y hora)</span></Label>
          <Input
            type="datetime-local"
            value={form.fechaHoraRecepcionDcc}
            onChange={(e) => set("fechaHoraRecepcionDcc", e.target.value)}
          />
        </div>
        <div>
          <Label>Volante de Oficialía de Partes/Correo</Label>
          <Input
            value={form.volanteOficialia}
            onChange={(e) => set("volanteOficialia", e.target.value)}
          />
        </div>
        <div>
          <Label>Número de oficio ente</Label>
          <Input
            value={form.numeroOficioEnte}
            onChange={(e) => set("numeroOficioEnte", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Firma / Origen">
        <div>
          <Label>Signado por</Label>
          <CreatableCombobox
            value={form.signadoPor}
            onChange={(v) => set("signadoPor", v)}
            suggestions={opt("signadoPor")}
          />
        </div>
        <div>
          <Label>Cargo / Puesto</Label>
          <CreatableCombobox
            value={form.cargoPuesto}
            onChange={(v) => set("cargoPuesto", v)}
            suggestions={opt("cargoPuesto")}
          />
        </div>
        <div>
          <Label>Asunto</Label>
          <CreatableCombobox
            value={form.asunto}
            onChange={(v) => set("asunto", v)}
            suggestions={opt("asunto")}
          />
        </div>
        <div>
          <Label>Ente</Label>
          <CreatableCombobox
            value={form.ente}
            onChange={(v) => set("ente", v)}
            suggestions={opt("ente")}
          />
        </div>
      </Section>

      <Section title="Sesión">
        <div>
          <Label>Nombre de Órgano Colegiado</Label>
          <CreatableCombobox
            value={form.organoColegiado}
            onChange={(v) => set("organoColegiado", v)}
            suggestions={opt("organoColegiado")}
          />
        </div>
        <div>
          <Label>Fecha y hora de la sesión</Label>
          <Input
            type="datetime-local"
            value={form.fechaHoraSesion}
            onChange={(e) => set("fechaHoraSesion", e.target.value)}
          />
        </div>
        <div>
          <Label>Número de la sesión</Label>
          <Input
            value={form.numeroSesion}
            onChange={(e) => set("numeroSesion", e.target.value)}
            placeholder="Ej. 03"
          />
        </div>
        <div>
          <Label>Tipo de sesión</Label>
          <CreatableCombobox
            value={form.tipoSesion}
            onChange={(v) => set("tipoSesion", v)}
            suggestions={opt("tipoSesion")}
          />
        </div>
        <div>
          <Label>Persona contralora ciudadana convocada</Label>
          <CreatableCombobox
            value={form.personaContralora}
            onChange={(v) => set("personaContralora", v)}
            suggestions={opt("personaContralora")}
          />
        </div>
        <div>
          <Label>Persona contralora ciudadana suplente</Label>
          <CreatableCombobox
            value={form.personaContraloraSuplente}
            onChange={(v) => set("personaContraloraSuplente", v)}
            suggestions={opt("personaContraloraSuplente")}
          />
        </div>
        <div>
          <Label>Carpeta de trabajo</Label>
          <YesNoSegmented
            value={form.carpetaTrabajo}
            onChange={(v) => set("carpetaTrabajo", v)}
          />
        </div>
        <div>
          <Label>Datos sesión virtual / presencial</Label>
          <YesNoSegmented
            value={form.sesionVirtualPresencial}
            onChange={(v) => set("sesionVirtualPresencial", v)}
          />
          {form.sesionVirtualPresencial === "Sí" && (
            <div className="mt-3 animate-rise">
              <Label>Datos de la sesión:</Label>
              <Textarea
                placeholder="Escribe aquí los datos de la sesión…"
                value={form.sesionVirtualDetalle}
                onChange={(e) => set("sesionVirtualDetalle", e.target.value)}
              />
            </div>
          )}
        </div>
      </Section>

      <Section title="Folio">
        <div>
          <Label>Consecutivo folio (SCG/DCC/CE/----/2026)</Label>
          <Input
            value={form.consecutivoFolio}
            onChange={(e) => set("consecutivoFolio", e.target.value)}
            placeholder="SCG/DCC/CE/----/2026"
          />
        </div>
        <div>
          <Label>Firma</Label>
          <CreatableCombobox
            value={form.firma}
            onChange={(v) => set("firma", v)}
            suggestions={opt("firma")}
          />
        </div>
      </Section>
    </Modal>
  );
}
