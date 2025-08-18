import useSWR, { SWRConfiguration } from "swr";
import { PublicMessagePreview } from "@/schemas/shared";

export const useChatBranchQuery = (
  chatId?: string | null,
  branchId?: string | null,
  config?: SWRConfiguration
) => {
  const key =
    chatId && branchId ? `/api/chats/${chatId}/branches/${branchId}` : null;

  return useSWR<PublicMessagePreview[]>(key, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    ...config,
  });
};
