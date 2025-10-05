import {
  publicUserBalanceSchema,
  type PublicUserBalance,
} from "@/schemas/shared";

export function transformToPublicUserBalance(input: {
  balance: number;
}): PublicUserBalance {
  return publicUserBalanceSchema.parse({
    balance: input.balance,
  });
}
