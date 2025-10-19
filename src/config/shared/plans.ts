export type PlanId = "free" | "spark" | "flame" | "blaze";
export type ModelTier = "free" | "cheap" | "premium";
export type ActionType = "chat" | "image";

// Central place to adjust plan names shown in UI
export const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  spark: "Spark",
  flame: "Flame",
  blaze: "Blaze",
};

// Map Clerk Billing plan slugs (Stripe price/product names in Clerk) to internal PlanId
// Adjust these to your Clerk Billing plan slugs
export const CLERK_PLAN_SLUG_TO_PLAN_ID: Record<string, string> = {
  free: "free",
  spark: process.env.NEXT_PUBLIC_SPARK_PLAN_ID as string,
  flame: process.env.NEXT_PUBLIC_FLAME_PLAN_ID as string,
  blaze: process.env.NEXT_PUBLIC_BLAZE_PLAN_ID as string,
};
