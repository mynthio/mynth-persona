import { z } from "zod";

/**
 * Public user balance schema returned by /api/me/balance
 * - Includes both purchased and free token information
 * - Keeps legacy `balance` field for total (backward compatibility)
 */
export const publicUserBalanceSchema = z.object({
  // Legacy total balance for compatibility
  balance: z.number(),

  // Preferred explicit fields
  totalBalance: z.number(),
  purchasedBalance: z.number(),
  dailyFreeTokensRemaining: z.number(),
  dailyTokensUsed: z.number(),
});

export type PublicUserBalance = z.infer<typeof publicUserBalanceSchema>;
