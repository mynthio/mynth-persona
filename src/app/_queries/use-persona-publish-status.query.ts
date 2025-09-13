import useSWR, { SWRConfiguration } from "swr";
import { fetcher } from "@/lib/fetcher";

export type PersonaPublishStatus = {
  visibility: "private" | "public" | "deleted";
  lastPublishAttempt: null | {
    status?: "pending" | "success" | "failed";
    attemptedAt?: string;
    runId?: string | null;
    error?: string | null;
  };
  publicVersionId: string | null;
  publicName: string | null;
  publishedAt: string | null;
};

export const usePersonaPublishStatusQuery = (
  personaId?: string | null,
  config?: SWRConfiguration
) => {
  return useSWR<PersonaPublishStatus>(
    personaId ? `/api/personas/${personaId}/publish-status` : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      ...config,
    }
  );
};