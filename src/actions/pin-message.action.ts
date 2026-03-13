"use server";
import "server-only";

import { db } from "@/db/drizzle";
import { messages } from "@/db/schema";
import { validateChatOwnershipCached } from "@/data/chats/get-chat.data";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { messageIdSchema } from "@/schemas/backend/messages/message.schema";
import { chatIdSchema } from "@/schemas/backend/chats/chat.schema";
import z from "zod";

const pinMessagePayloadSchema = z.object({
  messageId: messageIdSchema,
  chatId: chatIdSchema,
  pinned: z.boolean(),
  pinnedLabel: z.string().max(100).optional(),
});

export async function pinMessageAction(payload: {
  messageId: string;
  chatId: string;
  pinned: boolean;
  pinnedLabel?: string;
}) {
  await pinMessagePayloadSchema.parseAsync(payload);

  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  const chat = await validateChatOwnershipCached(payload.chatId, userId);
  if (!chat) throw new Error("Unauthorized");

  // Build the patch object
  const patch: Record<string, unknown> = { pinned: payload.pinned };
  if (payload.pinnedLabel !== undefined) {
    patch.pinnedLabel = payload.pinnedLabel;
  } else if (!payload.pinned) {
    // Clear label when unpinning
    patch.pinnedLabel = null;
  }

  await db
    .update(messages)
    .set({
      metadata: sql`COALESCE(${messages.metadata}, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb`,
    })
    .where(
      and(eq(messages.id, payload.messageId), eq(messages.chatId, payload.chatId))
    );

  return { success: true } as const;
}
