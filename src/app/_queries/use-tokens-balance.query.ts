import useSWR, {
  SWRConfiguration,
  useSWRConfig,
  type MutatorOptions,
} from "swr";
import { PublicUserBalance } from "@/schemas/shared";
import { useAuth } from "@clerk/nextjs";

export const useTokensBalance = (config?: SWRConfiguration) => {
  const { isSignedIn } = useAuth();
  return useSWR<PublicUserBalance>(isSignedIn ? "/api/me/balance" : null, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    ...config,
  });
};

export const useTokensBalanceMutation = (options?: MutatorOptions) => {
  const { mutate } = useSWRConfig();
  const { isSignedIn } = useAuth();

  return (
    mutator: (data: PublicUserBalance | undefined) => PublicUserBalance,
    options?: MutatorOptions
  ) =>
    mutate<PublicUserBalance>(isSignedIn ? "/api/me/balance" : null, mutator, {
      revalidate: false,
      ...options,
    });
};
