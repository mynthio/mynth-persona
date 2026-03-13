import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type PinnedMessage = {
  id: string;
  pinnedLabel: string | null;
  contentPreview: string | null;
  createdAt: string;
};

export type PinnedMessagesResponse = {
  data: PinnedMessage[];
};

export function usePinnedMessagesQuery(chatId: string | null) {
  const key = chatId ? `/api/chats/${chatId}/pinned-messages` : null;
  return useSWR<PinnedMessagesResponse>(key, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
}
