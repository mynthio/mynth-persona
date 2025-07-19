import useSWR, { useSWRConfig, type SWRConfiguration } from "swr";
import { PublicPersonaEventWithVersion } from "@/schemas/shared";

export const usePersonaEventsQuery = (
  personaId?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<PublicPersonaEventWithVersion[]>(
    personaId ? `/api/personas/${personaId}/events` : null,
    config
  );
};

export const usePersonaEventsMutation = (personaId: string) => {
  const { mutate } = useSWRConfig();

  return (
    mutator: (
      data: PublicPersonaEventWithVersion[] | undefined
    ) => PublicPersonaEventWithVersion[]
  ) =>
    mutate<PublicPersonaEventWithVersion[]>(
      `/api/personas/${personaId}/events`,
      mutator
    );
};
