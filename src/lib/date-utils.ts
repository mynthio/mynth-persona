import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

// Extend dayjs with UTC plugin
dayjs.extend(utc);

/**
 * Check if daily tokens should be reset based on UTC midnight boundary
 * @param lastResetDate - The last time daily tokens were reset (can be null for new users)
 * @returns true if tokens should be reset (new UTC day), false otherwise
 */
export function shouldResetDailyTokens(lastResetDate: Date | null): boolean {
  if (!lastResetDate) {
    // New user - should reset
    return true;
  }

  const now = dayjs.utc();
  const lastReset = dayjs.utc(lastResetDate);
  
  // Compare UTC dates - if they're different, it's a new day
  return !now.isSame(lastReset, 'day');
}

/**
 * Get current UTC time as Date object
 * @returns Current time in UTC
 */
export function getCurrentUTCTime(): Date {
  return dayjs.utc().toDate();
}

/**
 * Calculate daily free tokens remaining, applying reset logic if needed
 * @param dailyTokensUsed - Current daily tokens used count
 * @param lastResetDate - Last reset timestamp
 * @param maxDailyTokens - Maximum daily free tokens (e.g., DAILY_FREE_TOKENS)
 * @returns Object with remainingTokens and whether reset was applied
 */
export function calculateDailyFreeTokensRemaining(
  dailyTokensUsed: number,
  lastResetDate: Date | null,
  maxDailyTokens: number
): {
  remainingTokens: number;
  shouldReset: boolean;
  effectiveTokensUsed: number;
} {
  const shouldReset = shouldResetDailyTokens(lastResetDate);
  const effectiveTokensUsed = shouldReset ? 0 : dailyTokensUsed;
  const remainingTokens = Math.max(0, maxDailyTokens - effectiveTokensUsed);

  return {
    remainingTokens,
    shouldReset,
    effectiveTokensUsed,
  };
}