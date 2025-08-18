import { db } from "@/db/drizzle";
import { messages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Get the most recent message id in the chat by createdAt.
 * This serves as the leaf anchor for building a thread when no messageId is provided.
 */
export async function getLatestLeafForChat(
  chatId: string
): Promise<string | null> {
  const latest = await db.query.messages.findFirst({
    where: eq(messages.chatId, chatId),
    orderBy: [desc(messages.createdAt)],
    columns: { id: true },
  });

  return latest?.id ?? null;
}
