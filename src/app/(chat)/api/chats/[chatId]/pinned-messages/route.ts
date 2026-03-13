import "server-only";

import { validateChatOwnershipCached } from "@/data/chats/get-chat.data";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { messages } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

function extractContentPreview(parts: unknown): string | null {
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    if (part && typeof part === "object" && "type" in part && part.type === "text" && "text" in part) {
      const text = String((part as { text: string }).text);
      return text.slice(0, 200);
    }
  }
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { chatId } = await params;

  const chat = await validateChatOwnershipCached(chatId, userId);
  if (!chat) return new Response("Chat not found", { status: 404 });

  const rows = await db
    .select({
      id: messages.id,
      parts: messages.parts,
      metadata: messages.metadata,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.chatId, chatId),
        eq(sql`(${messages.metadata}->>'pinned')::boolean`, true)
      )
    )
    .orderBy(messages.createdAt);

  const data = rows.map((row) => {
    const meta = row.metadata as Record<string, unknown> | null;
    return {
      id: row.id,
      pinnedLabel: (meta?.pinnedLabel as string | null | undefined) ?? null,
      contentPreview: extractContentPreview(row.parts),
      createdAt: row.createdAt.toISOString(),
    };
  });

  return Response.json({ data });
}
