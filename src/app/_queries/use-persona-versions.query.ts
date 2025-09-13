import useSWR, { SWRConfiguration } from "swr";
import { PublicPersonaVersion } from "@/schemas/shared";
import { fetcher } from "@/lib/fetcher";

export const usePersonaVersionsQuery = (
  personaId?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<PublicPersonaVersion[]>(
    personaId ? `/api/personas/${personaId}/versions` : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      ...config,
    }
  );
};
