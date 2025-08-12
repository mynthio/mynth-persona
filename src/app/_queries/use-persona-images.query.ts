import useSWR, { useSWRConfig, type SWRConfiguration } from "swr";
import type { PublicPersonaImage } from "@/schemas/shared";

export const usePersonaImagesQuery = (
  personaId?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<PublicPersonaImage[]>(
    personaId ? `/api/personas/${personaId}/images` : null,
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
    mutate<PublicPersonaImage[]>(`/api/personas/${personaId}/images`, mutator, {
      revalidate: false,
    });
};
