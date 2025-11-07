import useSWR, { useSWRConfig, type SWRConfiguration } from "swr";
import type { PublicPersonaImage } from "@/schemas/shared";
import { fetcher } from "@/lib/fetcher";

export const usePersonaImagesQuery = (
  personaId?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<PublicPersonaImage[]>(
    personaId ? `/api/images?personaId=${personaId}` : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      ...config,
    }
  );
};

export const usePersonaImagesMutation = (personaId: string) => {
  const { mutate } = useSWRConfig();

  return (
    mutator: (
      data: PublicPersonaImage[] | undefined
    ) => PublicPersonaImage[] | undefined
  ) =>
    mutate<PublicPersonaImage[]>(`/api/images?personaId=${personaId}`, mutator, {
      revalidate: false,
    });
};
