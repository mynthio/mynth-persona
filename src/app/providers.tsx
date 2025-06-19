"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { HeroUIProvider } from "@heroui/system";
import { SWRConfig } from "swr";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <NuqsAdapter>
        <SWRConfig
          value={{
            fetcher,
          }}
        >
          <HeroUIProvider className="w-full h-full">{children}</HeroUIProvider>
        </SWRConfig>
      </NuqsAdapter>
    </ClerkProvider>
  );
}
