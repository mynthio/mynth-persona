import useSWR, {
  SWRConfiguration,
  useSWRConfig,
  type MutatorOptions,
} from "swr";
import { PublicChat } from "@/schemas/shared";

export const useChatMessagesQuery = (
  chatId?: string | null,
  branchId?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<any>(
    chatId
      ? `/api/chats/${chatId}/messages${
          branchId ? `?message_id=${branchId}` : ""
        }`
      : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      ...config,
    }
  );
};

export const useChatMessagesMutation = (
  chatId: string,
  options?: MutatorOptions
) => {
  const { mutate } = useSWRConfig();

  return (mutator: (data: any | undefined) => any, options?: MutatorOptions) =>
    mutate<any>(`/api/chats/${chatId}/messages`, mutator, {
      revalidate: false,
      ...options,
    });
};
