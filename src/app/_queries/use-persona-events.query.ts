import useSWR, {
  MutatorOptions,
  useSWRConfig,
  type SWRConfiguration,
} from "swr";
import { PublicPersonaEventWithVersion } from "@/schemas/shared";

export const usePersonaEventsQuery = (
  personaId?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<PublicPersonaEventWithVersion[]>(
    personaId ? `/api/personas/${personaId}/events` : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      ...config,
    }
  );
};

export const usePersonaEventsMutation = (personaId: string) => {
  const { mutate } = useSWRConfig();

  return (
    mutator: (
      data: PublicPersonaEventWithVersion[] | undefined
    ) => PublicPersonaEventWithVersion[] | undefined,
    options?: MutatorOptions
  ) =>
    mutate<PublicPersonaEventWithVersion[]>(
      `/api/personas/${personaId}/events`,
      mutator,
      {
        revalidate: false,
        ...options,
      }
    );
};
