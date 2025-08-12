import useSWR, { SWRConfiguration } from "swr";
import { PublicUserBalance } from "@/schemas/shared";
import { useAuth } from "@clerk/nextjs";

export const useUserBalanceQuery = (config?: SWRConfiguration) => {
  const { isSignedIn } = useAuth();
  return useSWR<PublicUserBalance>(isSignedIn ? "/api/me/balance" : null, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    ...config,
  });
};
