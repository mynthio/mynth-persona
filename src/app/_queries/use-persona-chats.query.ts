import useSWR, {
  SWRConfiguration,
  useSWRConfig,
  type MutatorOptions,
} from "swr";
import { PublicChat } from "@/schemas/shared";
import { fetcher } from "@/lib/fetcher";

export const usePersonaChatsQuery = (
  personaId?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<PublicChat[]>(
    personaId ? `/api/personas/${personaId}/chats` : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      ...config,
    }
  );
};

export const usePersonaChatsMutation = (
  personaId: string,
  options?: MutatorOptions
) => {
  const { mutate } = useSWRConfig();

  return (
    mutator: (data: PublicChat[] | undefined) => PublicChat[],
    options?: MutatorOptions
  ) =>
    mutate<PublicChat[]>(`/api/personas/${personaId}/chats`, mutator, {
      revalidate: false,
      ...options,
    });
};