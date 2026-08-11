import { useEffect } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "../components/__ErrorBoundary";
import { isWeb, startWebSafeArea } from "../lib/__web-safe-area";

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    if (isWeb) startWebSafeArea();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Slot />
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
