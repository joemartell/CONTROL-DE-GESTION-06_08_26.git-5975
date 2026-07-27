import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useTemplates() {
  return useQuery(orpc.templates.list.queryOptions());
}

export function useTemplateSlots() {
  return useQuery(orpc.templates.slots.queryOptions());
}

export function useResolvePrint(id: number, enabled: boolean) {
  return useQuery(
    orpc.templates.resolveForRecord.queryOptions({ input: { id }, enabled }),
  );
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: orpc.templates.key() });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation(
    orpc.templates.remove.mutationOptions({ onSuccess: () => invalidate(qc) }),
  );
}

export function useSetTemplateRule() {
  const qc = useQueryClient();
  return useMutation(
    orpc.templates.setRule.mutationOptions({ onSuccess: () => invalidate(qc) }),
  );
}
