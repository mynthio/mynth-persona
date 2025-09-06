import useSWR, { SWRConfiguration } from "swr";
import type { PublicPersonaListItem } from "@/schemas/shared/persona-public.schema";

// Legacy simple list (first page only) - kept for potential use elsewhere
export const usePublicPersonasQuery = (config?: SWRConfiguration) => {
  return useSWR<{ data: PublicPersonaListItem[]; nextCursor: string | null; hasMore: boolean }>(
    "/api/public/personas",
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      ...config,
    }
  );
};
