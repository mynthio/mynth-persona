import useSWR, { MutatorOptions, SWRConfiguration, useSWRConfig } from "swr";
import { PublicPersonaVersion } from "@/schemas/shared";

export const usePersonaVersionQuery = (
  personaId?: string | null,
  id: string | "current" = "current",
  config?: SWRConfiguration
) => {
  return useSWR<PublicPersonaVersion>(
    personaId ? `/api/personas/${personaId}/versions/${id}` : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      ...config,
    }
  );
};

export const usePersonaVersionMutation = (
  personaId?: string | null,
  versionId: string | "current" = "current",
  options?: MutatorOptions
) => {
  const { mutate } = useSWRConfig();

  return (
    mutator: (
      data: PublicPersonaVersion | undefined
    ) => PublicPersonaVersion | undefined
  ) =>
    mutate<PublicPersonaVersion>(
      personaId ? `/api/personas/${personaId}/versions/${versionId}` : null,
      mutator,
      {
        revalidate: false,
      }
    );
};
