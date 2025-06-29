"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { HeroUIProvider } from "@heroui/system";
import { SWRConfig } from "swr";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ToastProvider } from "@heroui/toast";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <ClerkProvider>
      <NuqsAdapter>
        <SWRConfig
          value={{
            fetcher,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
          }}
        >
          <HeroUIProvider
            className="w-full h-full overflow-auto"
            navigate={router.push}
          >
            <ToastProvider />
            {children}
          </HeroUIProvider>
        </SWRConfig>
      </NuqsAdapter>
    </ClerkProvider>
  );
}
