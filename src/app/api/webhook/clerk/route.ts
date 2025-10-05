import { WebhookEvent } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users, userTokens, tokenTransactions } from "@/db/schema";
import logsnag from "@/lib/logsnag";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const evt: WebhookEvent = await verifyWebhook(req);

    const { id, username, image_url } = evt.data as any;
    const eventType = evt.type;

    if (eventType === "user.created") {
      await db.transaction(async (tx) => {
        // Upsert user with username/image url and default displayName
        await tx
          .insert(users)
          .values({
            id: id as string,
            username: (username as string | null) ?? null,
            imageUrl: (image_url as string | null) ?? null,
            displayName: (username as string | null) ?? null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              username: (username as string | null) ?? null,
              imageUrl: (image_url as string | null) ?? null,
              displayName: (username as string | null) ?? null,
              updatedAt: new Date(),
            },
          });

        // Initialize tokens with starting balance 20 only if not existing
        const inserted = await tx
          .insert(userTokens)
          .values({
            userId: id as string,
            balance: 20,
            dailyTokensUsed: 0,
            lastDailyReset: new Date(),
            totalPurchased: 0,
            totalSpent: 0,
            updatedAt: new Date(),
          })
          .onConflictDoNothing()
          .returning({
            userId: userTokens.userId,
            balance: userTokens.balance,
          });

        // Create initial transaction entry if tokens were created
        if (inserted.length > 0) {
          await tx.insert(tokenTransactions).values({
            id: crypto.randomUUID(),
            userId: id as string,
            type: "purchase",
            status: "completed",
            amount: 20,
            balanceAfter: 20,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
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

    if (eventType === "user.updated") {
      await db
        .update(users)
        .set({
          username: (username as string | null) ?? null,
          imageUrl: (image_url as string | null) ?? null,
          displayName: (username as string | null) ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id as string));
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
