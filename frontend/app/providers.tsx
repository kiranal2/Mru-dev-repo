"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client instance inside the component to avoid sharing between requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "white",
            color: "#0F172A",
            border: "1px solid #E2E8F0",
            borderLeft: "4px solid #22C55E",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
          },
          classNames: {
            error: "[&]:!border-l-red-500",
            warning: "[&]:!border-l-amber-500",
            info: "[&]:!border-l-blue-500",
            success: "[&]:!border-l-green-500",
          },
        }}
      />
    </QueryClientProvider>
  );
}
