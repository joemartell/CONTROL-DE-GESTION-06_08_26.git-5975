import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export type OptionField =
  | "asunto" | "ente" | "signadoPor" | "cargoPuesto"
  | "organoColegiado" | "tipoSesion" | "personaContralora";

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
