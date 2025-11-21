import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

export function useMediaComments(mediaId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    mediaId ? `/api/media/${mediaId}/comments` : null,
    fetcher
  );

  return {
    comments: data?.comments ?? [],
    isLoading,
    error,
    mutate,
  };
}
