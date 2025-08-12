import useSWR, {
  SWRConfiguration,
  useSWRConfig,
  type MutatorOptions,
} from "swr";
import { PublicPersona } from "@/schemas/shared";

export const usePersonaQuery = (
  id?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<PublicPersona>(id ? `/api/personas/${id}` : null, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    ...config,
  });
};

export const usePersonaMutation = (id: string, options?: MutatorOptions) => {
  const { mutate } = useSWRConfig();

  return (
    mutator: (data: PublicPersona | undefined) => PublicPersona,
    options?: MutatorOptions
  ) =>
    mutate<PublicPersona>(`/api/personas/${id}`, mutator, {
      revalidate: false,
      ...options,
    });
};
