import useSWR, { SWRConfiguration } from "swr";
import { PublicPersonaVersion } from "@/schemas/shared";

export const usePersonaVersionsQuery = (
  personaId?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<PublicPersonaVersion[]>(
    personaId ? `/api/personas/${personaId}/versions` : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      ...config,
    }
  );
};