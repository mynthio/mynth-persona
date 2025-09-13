"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { SWRConfig } from "swr";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ToastProvider } from "@/components/ui/toast";
import { Suspense } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }}
      >
        <Suspense>
          <NuqsAdapter>
            <ToastProvider>{children}</ToastProvider>
          </NuqsAdapter>
        </Suspense>
      </SWRConfig>
    </ClerkProvider>
  );
}
