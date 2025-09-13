import useSWR, { SWRConfiguration } from "swr";
import { PublicMessagePreview } from "@/schemas/shared";
import { fetcher } from "@/lib/fetcher";

export const useChatBranchQuery = (
  chatId?: string | null,
  branchId?: string | null,
  config?: SWRConfiguration
) => {
  const key =
    chatId && branchId ? `/api/chats/${chatId}/branches/${branchId}` : null;

  return useSWR<PublicMessagePreview[]>(key, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    ...config,
  });
};
