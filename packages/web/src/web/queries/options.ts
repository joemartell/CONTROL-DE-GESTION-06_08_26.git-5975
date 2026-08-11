import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export type OptionField =
  | "asunto"
  | "ente"
  | "signadoPor"
  | "cargoPuesto"
  | "organoColegiado"
  | "tipoSesion"
  | "personaContralora"
  | "personaContraloraSuplente"
  | "firma"
  | "ccep";

export function useOptions() {
  return useQuery(orpc.options.all.queryOptions());
}

export function useAddOption() {
  const qc = useQueryClient();
  return useMutation(
    orpc.options.add.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.options.key() }),
    }),
  );
}

export function useRemoveOptionByValue() {
  const qc = useQueryClient();
  return useMutation(
    orpc.options.removeByValue.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.options.key() }),
    }),
  );
}
