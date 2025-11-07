import useSWR, {
  SWRConfiguration,
  useSWRConfig,
  type MutatorOptions,
} from "swr";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@clerk/nextjs";

export type UserPersonaListItem = {
  id: string;
  title: string | null;
  currentVersionId: string | null;
  profileImageIdMedia: string | null;
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
  if (params?.cursorCreatedAt)
    query.set("cursorCreatedAt", params.cursorCreatedAt);
  if (params?.cursorId) query.set("cursorId", params.cursorId);

  const key = `/api/personas${query.toString() ? `?${query.toString()}` : ""}`;

  return useSWR<UserPersonasResponse>(key, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    ...config,
  });
};

export const useUserPersonasMutation = (
  params?: UseUserPersonasParams,
  options?: MutatorOptions
) => {
  const { mutate } = useSWRConfig();
  const { isSignedIn } = useAuth();

  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.cursorCreatedAt)
    query.set("cursorCreatedAt", params.cursorCreatedAt);
  if (params?.cursorId) query.set("cursorId", params.cursorId);

  const key = isSignedIn
    ? `/api/personas${query.toString() ? `?${query.toString()}` : ""}`
    : null;

  return (
    mutator: (
      data: UserPersonasResponse | undefined
    ) => UserPersonasResponse | undefined,
    opts?: MutatorOptions
  ) =>
    mutate<UserPersonasResponse | undefined>(key, mutator, {
      revalidate: false,
      ...(options ?? {}),
      ...(opts ?? {}),
    });
};
