"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { SWRConfig } from "swr";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
          }}
        >
          <Suspense>
            <NuqsAdapter>
              {children}
              <Toaster position="top-center" />
            </NuqsAdapter>
          </Suspense>
        </SWRConfig>
      </ThemeProvider>
    </ClerkProvider>
  );
}
