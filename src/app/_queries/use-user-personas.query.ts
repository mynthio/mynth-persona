import useSWR, { SWRConfiguration } from "swr";

export type UserPersonaListItem = {
  id: string;
  title: string | null;
  currentVersionId: string | null;
  profileImageId: string | null;
  // Note: serialized as ISO string from API
  createdAt: string;
};

export type UserPersonasResponse = {
  data: UserPersonaListItem[];
  nextCreatedAt: string | null;
  nextId: string | null;
  hasMore: boolean;
};

export type UseUserPersonasParams = {
  q?: string;
  cursorCreatedAt?: string;
  cursorId?: string;
};

export const useUserPersonasQuery = (
  params?: UseUserPersonasParams,
  config?: SWRConfiguration
) => {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
  if (params?.cursorId) query.set("cursorId", params.cursorId);

  const key = `/api/personas${query.toString() ? `?${query.toString()}` : ""}`;

  return useSWR<UserPersonasResponse>(key, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    ...config,
  });
};