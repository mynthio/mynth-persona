import useSWR, {
  SWRConfiguration,
  useSWRConfig,
  type MutatorOptions,
} from "swr";
import { MessageBranchesByParent } from "@/schemas/shared";
import { fetcher } from "@/lib/fetcher";

export const useChatBranchesQuery = (
  chatId?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<MessageBranchesByParent>(
    chatId ? `/api/chats/${chatId}/branches` : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      ...config,
    }
  );
};

export const useChatBranchesMutation = (options?: MutatorOptions) => {
  const { mutate } = useSWRConfig();

  return (
    { chatId }: { chatId: string },
    mutator: (
      data: MessageBranchesByParent | undefined
    ) => MessageBranchesByParent,
    options?: MutatorOptions
  ) =>
    mutate<MessageBranchesByParent>(`/api/chats/${chatId}/branches`, mutator, {
      revalidate: false,
      ...options,
    });
};
