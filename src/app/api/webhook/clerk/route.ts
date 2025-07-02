import { WebhookEvent } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import logsnag from "@/lib/logsnag";

export async function POST(req: NextRequest) {
  try {
    const evt: WebhookEvent = await verifyWebhook(req);

    const { id } = evt.data;
    const eventType = evt.type;

    if (eventType === "user.created") {
      await db.insert(users).values({
        id: id as string,
      });

      await logsnag.identify({
        user_id: id as string,
        properties: {
          email: evt.data.email_addresses[0].email_address,
        },
      });
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Error verifying webhook" },
      { status: 400 }
    );
  }
}
