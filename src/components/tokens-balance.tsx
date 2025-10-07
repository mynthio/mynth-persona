"use client";

import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";

export function TokensBalance() {
  const { isSignedIn } = useAuth();

  const { data, isLoading } = useSWR(isSignedIn ? "/api/me/balance" : null);

  if (isLoading || !data) return null;

  return <>{data.balance}</>;
}
