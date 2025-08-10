import {
  publicUserBalanceSchema,
  type PublicUserBalance,
} from "@/schemas/shared";

export function transformToPublicUserBalance(input: {
  purchasedBalance: number;
  dailyFreeTokensRemaining: number;
  dailyTokensUsed: number;
}): PublicUserBalance {
  const totalBalance = input.purchasedBalance + input.dailyFreeTokensRemaining;

  return publicUserBalanceSchema.parse({
    balance: totalBalance, // legacy
    totalBalance,
    purchasedBalance: input.purchasedBalance,
    dailyFreeTokensRemaining: input.dailyFreeTokensRemaining,
    dailyTokensUsed: input.dailyTokensUsed,
  });
}
