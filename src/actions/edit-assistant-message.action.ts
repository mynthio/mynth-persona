"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { messages } from "@/db/schema";
import { validateChatOwnershipCached } from "@/data/chats/get-chat.data";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { messageIdSchema } from "@/schemas/backend/messages/message.schema";
import { redis } from "@/lib/redis";
import { nanoid } from "nanoid";
import z from "zod";

const editAssistantMessageSchema = z.object({
  messageId: messageIdSchema,
  text: z.string().min(1),
  mode: z.enum(["update", "save_as_new"]),
});

export type EditAssistantMessageInput = z.infer<
  typeof editAssistantMessageSchema
>;

export async function editAssistantMessageAction(
  input: EditAssistantMessageInput,
) {
  const { messageId, text, mode } = editAssistantMessageSchema.parse(input);

  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  // Get the message to find its chatId and verify it's an assistant message
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    columns: { id: true, chatId: true, role: true, parentId: true, metadata: true },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.role !== "assistant") {
    throw new Error("Can only edit assistant messages with this action");
  }

  // Verify the user owns the chat
  const chat = await validateChatOwnershipCached(message.chatId, userId);

  if (!chat) {
    throw new Error("Unauthorized");
  }

  if (mode === "update") {
    // Mode 1: Update the message in place
    await db
      .update(messages)
      .set({
        parts: [{ type: "text", text }],
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId));

    // Invalidate Redis leaf cache
    await redis.del(`chat:${message.chatId}:leaf`).catch(() => {});

    return { success: true, mode: "update" as const, messageId };
  }

  // Mode 2: Save as a new message (creates a branch)
  const newMessageId = `msg_${nanoid(32)}`;

  await db.insert(messages).values({
    id: newMessageId,
    parentId: message.parentId,
    chatId: message.chatId,
    role: "assistant",
    parts: [{ type: "text", text }],
    metadata: {
      ...(message.metadata as Record<string, unknown> ?? {}),
      parentId: message.parentId,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Invalidate Redis leaf cache
  await redis.del(`chat:${message.chatId}:leaf`).catch(() => {});

  return {
    success: true,
    mode: "save_as_new" as const,
    messageId: newMessageId,
    originalMessageId: messageId,
    parentId: message.parentId,
  };
}
