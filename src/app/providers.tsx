"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { HeroUIProvider } from "@heroui/system";
import { SWRConfig } from "swr";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ToastProvider } from "@heroui/toast";
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
            <HeroUIProvider className="w-full h-full" navigate={router.push}>
              <ToastProvider />
              {children}
            </HeroUIProvider>
          </NuqsAdapter>
        </Suspense>
      </SWRConfig>
    </ClerkProvider>
  );
}
