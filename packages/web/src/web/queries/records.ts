import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useRecordsByYear(anio: number) {
  return useQuery(orpc.records.listByYear.queryOptions({ input: { anio } }));
}

export function useRecordsByMonth(anio: number, mes: number) {
  return useQuery(
    orpc.records.listByMonth.queryOptions({ input: { anio, mes } }),
  );
}

export function useAllRecords() {
  return useQuery(orpc.records.listAll.queryOptions());
}

export function useYears() {
  return useQuery(orpc.records.years.queryOptions());
}

export function useRecord(id: number) {
  return useQuery(orpc.records.get.queryOptions({ input: { id }, enabled: !!id }));
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: orpc.records.key() });
  qc.invalidateQueries({ queryKey: orpc.options.key() });
}

export function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation(
    orpc.records.create.mutationOptions({ onSuccess: () => invalidateAll(qc) }),
  );
}

export function useUpdateRecord() {
  const qc = useQueryClient();
  return useMutation(
    orpc.records.update.mutationOptions({ onSuccess: () => invalidateAll(qc) }),
  );
}

export function useDeleteRecord() {
  const qc = useQueryClient();
  return useMutation(
    orpc.records.remove.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.records.key() }),
    }),
  );
}
