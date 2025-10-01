"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { chatIdSchema } from "@/schemas/backend/chats/chat.schema";

export async function deleteChatAction(chatId: string) {
  await chatIdSchema.parseAsync(chatId);

  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  // Ensure chat exists and belongs to user
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
    columns: { id: true },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  // Delete chat (CASCADE will remove related records)
  await db.delete(chats).where(and(eq(chats.id, chatId), eq(chats.userId, userId)));

  return { success: true } as const;
}