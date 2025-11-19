import useSWR, { MutatorOptions, SWRConfiguration, useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import type { PublicChat } from "@/schemas/shared";

export type UserChatListItem = PublicChat;

export type UserChatsResponse = {
  data: UserChatListItem[];
  nextUpdatedAt: string | null;
  nextId: string | null;
  hasMore: boolean;
};

export const useUserChatsQuery = (
  params?: {
    q?: string;
    cursorUpdatedAt?: string | null;
    cursorId?: string | null;
  } | null,
  config?: SWRConfiguration
) => {
  // If params is explicitly null, disable fetching
  // Otherwise, build the query string and key
  let key: string | null = null;

  if (params !== null) {
    const search = new URLSearchParams();

    if (params?.q) search.set("q", params.q);
    if (params?.cursorUpdatedAt && params.cursorId) {
      search.set("cursorUpdatedAt", params.cursorUpdatedAt);
      search.set("cursorId", params.cursorId);
    }

    const qs = search.toString();
    // Include query params in the key so different searches are cached separately
    key = qs ? `/api/chats?${qs}` : "/api/chats";
  }

  return useSWR<UserChatsResponse>(key, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    ...config,
  });
};

export const useUserChatsMutation = () => {
  const { mutate } = useSWRConfig();

  return (
    mutator: (
      data: UserChatsResponse | undefined
    ) => UserChatsResponse | undefined,
    options?: MutatorOptions
  ) =>
    mutate<UserChatsResponse>(`/api/chats`, mutator, {
      revalidate: false,
      ...options,
    });
};
