"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { messages } from "@/db/schema";
import { validateChatOwnershipCached } from "@/data/chats/get-chat.data";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { messageIdSchema } from "@/schemas/backend/messages/message.schema";

export async function deleteMessageAction(messageId: string) {
  await messageIdSchema.parseAsync(messageId);

  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  // Get the message to find its chatId
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    columns: { id: true, chatId: true },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  // Verify the user owns the chat using cached ownership check
  const chat = await validateChatOwnershipCached(message.chatId, userId);

  if (!chat) {
    throw new Error("Unauthorized");
  }

  // Delete message (CASCADE will remove child messages based on parentId)
  await db.delete(messages).where(eq(messages.id, messageId));

  return { success: true } as const;
}
