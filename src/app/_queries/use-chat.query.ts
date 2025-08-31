import useSWR, { SWRConfiguration, useSWRConfig, type MutatorOptions } from "swr";
import { PublicChatDetail } from "@/schemas/shared";

export const useChatQuery = (
  id?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<PublicChatDetail>(id ? `/api/chats/${id}` : null, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    ...config,
  });
};

export const useChatMutation = (id: string, options?: MutatorOptions) => {
  const { mutate } = useSWRConfig();

  return (
    mutator: (data: PublicChatDetail | undefined) => PublicChatDetail,
    options?: MutatorOptions
  ) =>
    mutate<PublicChatDetail>(`/api/chats/${id}`, mutator, {
      revalidate: false,
      ...options,
    });
};