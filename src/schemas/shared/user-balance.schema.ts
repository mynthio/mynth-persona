import { z } from "zod";

/**
 * Public user balance schema returned by /api/me/balance
 * Simplified to a single `balance` value sourced from DB.
 */
export const publicUserBalanceSchema = z.object({
  balance: z.number(),
});

export type PublicUserBalance = z.infer<typeof publicUserBalanceSchema>;
