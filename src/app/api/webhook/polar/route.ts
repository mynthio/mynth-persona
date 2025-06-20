// api/webhook/polar/route.ts
import { logger } from "@/lib/logger";
import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    logger.debug(payload, "Polar Webhook Received");
  },
});
