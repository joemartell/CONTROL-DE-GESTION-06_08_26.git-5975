import { Modal } from "./ui/modal";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function fmtDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v.length <= 10 ? v + "T00:00:00" : v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtDateTime(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-border/70 py-2 sm:grid-cols-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-1">
        {label}
      </dt>
      <dd className="text-sm text-ink sm:col-span-2">{value || "—"}</dd>
    </div>
  );
}

export function RecordDetail({
  open,
  onClose,
  record,
}: {
  open: boolean;
  onClose: () => void;
  record: any | null;
}) {
  if (!record) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Registro #${record.consecutivo}`}
      subtitle={`${MESES[(record.mes ?? 1) - 1]} ${record.anio}`}
    >
      <dl>
        <Row label="Consecutivo" value={record.consecutivo} />
        <Row label="Fecha recepción oficialía" value={fmtDate(record.fechaRecepcionOficialia)} />
        <Row label="Hora de recepción" value={record.horaRecepcion} />
        <Row label="Hora recepción DCC" value={fmtDateTime(record.fechaHoraRecepcionDcc)} />
        <Row label="Volante Oficialía/Correo" value={record.volanteOficialia} />
        <Row label="Número de oficio ente" value={record.numeroOficioEnte} />
        <Row label="Signado por" value={record.signadoPor} />
        <Row label="Cargo / Puesto" value={record.cargoPuesto} />
        <Row label="Asunto" value={record.asunto} />
        <Row label="Ente" value={record.ente} />
        <Row label="Órgano Colegiado" value={record.organoColegiado} />
        <Row label="Fecha y hora de sesión" value={fmtDateTime(record.fechaHoraSesion)} />
        <Row label="Número de la sesión" value={record.numeroSesion} />
        <Row label="Tipo de sesión" value={record.tipoSesion} />
        <Row label="Persona contralora ciudadana convocada" value={record.personaContralora} />
        <Row label="Persona contralora ciudadana suplente" value={record.personaContraloraSuplente} />
        <Row label="Carpeta de trabajo" value={record.carpetaTrabajo} />
        <Row label="Sesión virtual/presencial" value={record.sesionVirtualPresencial} />
        {record.sesionVirtualPresencial === "Sí" && (
          <Row label="Datos de la sesión" value={record.sesionVirtualDetalle} />
        )}
        <Row label="Consecutivo folio" value={record.consecutivoFolio} />
        <Row label="Firma" value={record.firma} />
      </dl>
    </Modal>
  );
}
