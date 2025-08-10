"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { SWRConfig } from "swr";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppToastProvider } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <ClerkProvider>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }}
      >
        <Suspense>
          <NuqsAdapter>
            <AppToastProvider>{children}</AppToastProvider>
          </NuqsAdapter>
        </Suspense>
      </SWRConfig>
    </ClerkProvider>
  );
}
