import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Varios equipos pueden trabajar al mismo tiempo contra el mismo servidor,
// así que refrescamos periódicamente para ver los cambios de los demás.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 10_000,
      refetchOnWindowFocus: true,
      staleTime: 5_000,
    },
  },
});

interface ProviderProps {
  children: React.ReactNode;
}

// App-level providers — add theme/context providers here, wrapping children.
// QueryClientProvider must stay (all API calls run through TanStack Query).
export function Provider({ children }: ProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
