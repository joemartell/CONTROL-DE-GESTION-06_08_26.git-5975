import * as React from "react";
import { Link } from "wouter";
import { FileText, Download, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { useResolvePrint } from "../queries/templates";

function download(recordId: number, templateId: number) {
  const url = `/api/records/${recordId}/print?templateId=${templateId}`;
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function PrintDialog({
  open,
  onClose,
  record,
}: {
  open: boolean;
  onClose: () => void;
  record: any | null;
}) {
  const id = record?.id ?? 0;
  const resolve = useResolvePrint(id, open && !!id);
  const [choice, setChoice] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (open) setChoice(null);
  }, [open, id]);

  const data = resolve.data;
  const all = (data?.allTemplates ?? []) as {
    id: number; name: string; ruleKey: string | null; firma: string | null;
  }[];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={`Imprimir registro #${record?.consecutivo ?? ""}`}
      subtitle="Se genera un .docx con los datos de este registro."
    >
      {resolve.isLoading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Determinando plantilla…
        </div>
      ) : all.length === 0 ? (
        <div className="rounded-lg border border-accent/50 bg-accent/10 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2 font-semibold text-wine-900">
            <AlertTriangle className="size-5 text-accent" /> No hay plantillas cargadas
          </div>
          <p className="text-muted-foreground">
            Ve a{" "}
            <Link to="/plantillas" className="font-semibold text-primary underline">
              Plantillas
            </Link>{" "}
            y sube tus archivos .docx para poder imprimir.
          </p>
        </div>
      ) : data?.template ? (
        <div>
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-600/30 bg-green-600/10 p-3">
            <CheckCircle2 className="mt-0.5 size-5 text-green-700" />
            <div className="text-sm">
              <p className="font-semibold text-ink">
                {data.matchedBy === "regla_y_firma"
                  ? `Plantilla de la firma ${data.firma}`
                  : "Plantilla determinada por regla"}
              </p>
              <p className="text-muted-foreground">{data.ruleLabel}</p>
              {data.matchedBy === "regla" && data.firma && (
                <p className="text-xs text-muted-foreground">
                  La firma {data.firma} no tiene plantilla propia: se usa la general de la regla.
                </p>
              )}
              <p className="mt-1 font-medium text-primary">
                <FileText className="mr-1 inline size-4" />
                {data.template.name}
              </p>
            </div>
          </div>
          <Button onClick={() => download(id, data.template!.id)} className="w-full">
            <Download className="size-4" /> Descargar .docx
          </Button>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-accent/50 bg-accent/10 p-3">
            <AlertTriangle className="mt-0.5 size-5 text-accent" />
            <div className="text-sm text-muted-foreground">
              {data?.ruleLabel
                ? <>La regla <b>{data.ruleLabel}</b> no tiene una plantilla asignada.</>
                : "Este registro no coincide con ninguna regla automática."}{" "}
              Elige manualmente qué plantilla usar:
            </div>
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {all.map((t) => (
              <button
                key={t.id}
                onClick={() => setChoice(t.id)}
                className={`flex w-full items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                  choice === t.id
                    ? "border-primary bg-primary/5 font-semibold text-primary"
                    : "border-border hover:bg-secondary"
                }`}
              >
                <FileText className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                {t.firma && (
                  <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-wine-900">
                    {t.firma}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Button
            onClick={() => choice && download(id, choice)}
            disabled={!choice}
            className="mt-4 w-full"
          >
            <Download className="size-4" /> Descargar .docx
          </Button>
        </div>
      )}
    </Modal>
  );
}
