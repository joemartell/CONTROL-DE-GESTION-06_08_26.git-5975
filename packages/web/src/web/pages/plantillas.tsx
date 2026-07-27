import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UploadCloud, FileText, Trash2, Loader2, Link2, CheckCircle2 } from "lucide-react";
import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { useTemplates, useTemplateSlots, useDeleteTemplate, useSetTemplateRule } from "../queries/templates";
import { orpc } from "../lib/api";

const RULE_OPTIONS = [
  { value: "", label: "Sin regla (elegible manualmente)" },
  { value: "convocatoria", label: "ASUNTO = Convocatoria" },
  { value: "extemporaneo", label: "ASUNTO = Extemporáneo" },
  { value: "no_carpeta_si_virtual", label: "Carpeta=No · Virtual/Presencial=Sí" },
  { value: "si_carpeta_no_virtual", label: "Carpeta=Sí · Virtual/Presencial=No" },
  { value: "ambos_no", label: "Carpeta=No · Virtual/Presencial=No" },
];

export default function Plantillas() {
  const qc = useQueryClient();
  const templates = useTemplates();
  const slots = useTemplateSlots();
  const del = useDeleteTemplate();
  const setRule = useSetTemplateRule();

  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [name, setName] = React.useState("");
  const [ruleKey, setRuleKey] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<any | null>(null);

  const openUpload = (preselectRule = "") => {
    setFile(null);
    setName("");
    setRuleKey(preselectRule);
    setError(null);
    setUploadOpen(true);
  };

  const submitUpload = async () => {
    if (!file) {
      setError("Selecciona un archivo .docx");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name || file.name.replace(/\.docx$/i, ""));
      if (ruleKey) fd.append("ruleKey", ruleKey);
      const res = await fetch("/api/templates/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Error al subir");
      }
      qc.invalidateQueries({ queryKey: orpc.templates.key() });
      setUploadOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-8 py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-wine-900">Plantillas .docx</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sube tus documentos de Word con etiquetas <code className="rounded bg-secondary px-1">{"{etiqueta}"}</code>.
              Consulta la lista de etiquetas en <b>Ayuda</b>.
            </p>
          </div>
          <Button size="lg" onClick={() => openUpload()}>
            <UploadCloud className="size-4" /> Subir plantilla
          </Button>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-primary">Plantillas por regla</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Cada regla usa una plantilla al imprimir. Si una regla no tiene plantilla, la app preguntará cuál usar.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(slots.data ?? []).map((s) => (
              <div
                key={s.ruleKey}
                className="rounded-lg border border-border bg-card p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
                {s.template ? (
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-ink">
                    <CheckCircle2 className="size-4 text-green-700" /> {s.template.name}
                  </div>
                ) : (
                  <button
                    onClick={() => openUpload(s.ruleKey)}
                    className="mt-2 text-sm font-medium text-primary underline"
                  >
                    Asignar plantilla…
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-primary">Todas las plantillas</h2>
          {templates.isLoading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> Cargando…
            </div>
          ) : (templates.data ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Aún no has subido plantillas.
            </p>
          ) : (
            <div className="space-y-2">
              {(templates.data ?? []).map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <FileText className="size-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.originalName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link2 className="size-4 text-muted-foreground" />
                    <select
                      value={t.ruleKey ?? ""}
                      onChange={(e) =>
                        setRule.mutate({ id: t.id, ruleKey: (e.target.value || null) as any })
                      }
                      className="h-9 rounded-md border border-input bg-white px-2 text-xs text-ink outline-none focus:border-primary"
                    >
                      {RULE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <button
                      title="Eliminar"
                      onClick={() => setToDelete(t)}
                      className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        title="Subir plantilla .docx"
        subtitle="El archivo se guarda localmente en datos/plantillas."
        footer={
          <>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={submitUpload} disabled={uploading}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              Subir
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Archivo .docx</Label>
            <input
              type="file"
              accept=".docx"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !name) setName(f.name.replace(/\.docx$/i, ""));
              }}
              className="block w-full text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          <div>
            <Label>Nombre visible</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Convocatoria estándar" />
          </div>
          <div>
            <Label>Asignar a regla</Label>
            <select
              value={ruleKey}
              onChange={(e) => setRuleKey(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-ink outline-none focus:border-primary"
            >
              {RULE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </Modal>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        size="sm"
        title="Eliminar plantilla"
        footer={
          <>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={del.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={del.isPending}
              onClick={async () => {
                await del.mutateAsync({ id: toDelete.id });
                setToDelete(null);
              }}
            >
              {del.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          ¿Eliminar la plantilla <b className="text-ink">{toDelete?.name}</b>? También se borra el archivo del disco.
        </p>
      </Modal>
    </Layout>
  );
}
