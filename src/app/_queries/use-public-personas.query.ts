import useSWR, { SWRConfiguration } from "swr";
import type { PublicPersonaListItem } from "@/schemas/shared/persona-public.schema";
import { fetcher } from "@/lib/fetcher";

// Legacy simple list (first page only) - kept for potential use elsewhere
export const usePublicPersonasQuery = (config?: SWRConfiguration) => {
  return useSWR<{
    data: PublicPersonaListItem[];
    nextPublishedAt: string | null;
    nextId: string | null;
    hasMore: boolean;
  }>("/api/public/personas", fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    ...config,
  });
};
