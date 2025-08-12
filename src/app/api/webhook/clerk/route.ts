import { WebhookEvent } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import logsnag from "@/lib/logsnag";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const evt: WebhookEvent = await verifyWebhook(req);

    const { id } = evt.data;
    const eventType = evt.type;

    if (eventType === "user.created") {
      await db.insert(users).values({
        id: id as string,
      });

      await logsnag
        .identify({
          user_id: id as string,
          properties: {
            id: id as string,
          },
        })
        .catch((err) => {});
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (err) {
    const normalizedError =
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : { name: "UnknownError", message: String(err) };

    logger.error(
      {
        event: "webhook-error",
        component: "webhook:clerk:route",
        request_id:
          req.headers.get("x-request-id") ||
          req.headers.get("x-vercel-id") ||
          undefined,
        attributes: {
          path: req.nextUrl.pathname,
          method: req.method,
          svix_id: req.headers.get("svix-id") || undefined,
          svix_timestamp: req.headers.get("svix-timestamp") || undefined,
        },
        error: normalizedError,
      },
      "Clerk webhook handling failed"
    );

    return NextResponse.json(
      { error: "Error verifying webhook" },
      { status: 400 }
    );
  }
}
