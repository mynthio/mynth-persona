import useSWR, {
  SWRConfiguration,
  useSWRConfig,
  type MutatorOptions,
} from "swr";
import { PublicPersona } from "@/schemas/shared";
import { fetcher } from "@/lib/fetcher";

export const usePersonaQuery = (
  id?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<PublicPersona>(id ? `/api/personas/${id}` : null, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    ...config,
  });
};

