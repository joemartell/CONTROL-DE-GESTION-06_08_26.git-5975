import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud, FileText, Trash2, Loader2, Link2, CheckCircle2,
  ChevronDown, ChevronRight, PenLine,
} from "lucide-react";
import { Layout } from "../components/layout";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import {
  useTemplates, useTemplateSlots, useDeleteTemplate, useSetTemplateRule, useFirmas,
} from "../queries/templates";
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
  const firmas = useFirmas();
  const del = useDeleteTemplate();
  const setRule = useSetTemplateRule();

  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [name, setName] = React.useState("");
  const [ruleKey, setRuleKey] = React.useState("");
  const [firma, setFirma] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<any | null>(null);
  const [abierta, setAbierta] = React.useState<string | null>(null);

  const listaFirmas = firmas.data ?? [];

  const openUpload = (preRule = "", preFirma = "") => {
    setFile(null);
    setName("");
    setRuleKey(preRule);
    setFirma(preFirma);
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
      if (ruleKey && firma) fd.append("firma", firma);
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
          <h2 className="mb-3 font-display text-lg font-semibold text-primary">Plantillas por regla y firma</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Al imprimir, la app busca primero una plantilla de la <b>misma regla y misma firma</b>.
            Si esa firma no tiene una propia, usa la <b>plantilla general</b> de la regla.
            Si no hay ninguna, pregunta cuál usar.
          </p>
          <div className="space-y-3">
            {(slots.data ?? []).map((s: any) => {
              const abierto = abierta === s.ruleKey;
              const conFirma = (s.porFirma ?? []).filter((f: any) => f.template);
              return (
                <div key={s.ruleKey} className="rounded-lg border border-border bg-card">
                  <div className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {s.label}
                      </p>
                      {s.template ? (
                        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-ink">
                          <CheckCircle2 className="size-4 text-green-700" />
                          <span className="truncate">{s.template.name}</span>
                          <span className="text-xs font-normal text-muted-foreground">(general)</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => openUpload(s.ruleKey)}
                          className="mt-2 text-sm font-medium text-primary underline"
                        >
                          Asignar plantilla general…
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setAbierta(abierto ? null : s.ruleKey)}
                      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-secondary"
                    >
                      {abierto ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      Por firma
                      {conFirma.length > 0 && (
                        <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                          {conFirma.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {abierto && (
                    <div className="animate-rise border-t border-border bg-secondary/40 p-4">
                      <p className="mb-3 text-xs text-muted-foreground">
                        Plantilla distinta para cada firma en esta regla. Las que quedan vacías usan la general.
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {(s.porFirma ?? []).map((f: any) => (
                          <div
                            key={f.firma}
                            className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2"
                          >
                            <span className="w-14 shrink-0 font-display text-sm font-bold text-wine-900">
                              {f.firma}
                            </span>
                            {f.template ? (
                              <span className="flex min-w-0 items-center gap-1.5 text-sm text-ink">
                                <PenLine className="size-3.5 shrink-0 text-green-700" />
                                <span className="truncate">{f.template.name}</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => openUpload(s.ruleKey, f.firma)}
                                className="text-sm text-primary underline"
                              >
                                Asignar…
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
              {(templates.data ?? []).map((t: any) => (
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
                        setRule.mutate({
                          id: t.id,
                          ruleKey: (e.target.value || null) as any,
                          firma: e.target.value ? t.firma : null,
                        })
                      }
                      className="h-9 rounded-md border border-input bg-white px-2 text-xs text-ink outline-none focus:border-primary"
                    >
                      {RULE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <select
                      value={t.firma ?? ""}
                      disabled={!t.ruleKey}
                      title={t.ruleKey ? "Firma" : "Primero asigna una regla"}
                      onChange={(e) =>
                        setRule.mutate({
                          id: t.id,
                          ruleKey: t.ruleKey,
                          firma: e.target.value || null,
                        })
                      }
                      className="h-9 rounded-md border border-input bg-white px-2 text-xs text-ink outline-none focus:border-primary disabled:opacity-50"
                    >
                      <option value="">Todas las firmas</option>
                      {listaFirmas.map((f) => (
                        <option key={f} value={f}>{f}</option>
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
          <div>
            <Label>Firma</Label>
            <select
              value={firma}
              disabled={!ruleKey}
              onChange={(e) => setFirma(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-ink outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="">Todas las firmas (plantilla general de la regla)</option>
              {listaFirmas.map((f) => (
                <option key={f} value={f}>Solo firma {f}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {ruleKey
                ? "Elige una firma si esta plantilla es exclusiva de esa persona; deja «Todas» para que sirva de respaldo."
                : "Primero elige una regla para poder asignar una firma."}
            </p>
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
