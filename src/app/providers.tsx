"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { SWRConfig } from "swr";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ToastProvider } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

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
            <ToastProvider>{children}</ToastProvider>
          </NuqsAdapter>
        </Suspense>
      </SWRConfig>
    </ClerkProvider>
  );
}
