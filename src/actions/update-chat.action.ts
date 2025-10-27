"use server";
import "server-only";

import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";
import { UpdateChatPayload, updateChatPayloadSchema } from "@/schemas";
import { chatIdSchema } from "@/schemas/backend/chats/chat.schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { updateTag } from "next/cache";

export const updateChatAction = async (
  chatId: string,
  payload: UpdateChatPayload
) => {
  await chatIdSchema.parseAsync(chatId);
  await updateChatPayloadSchema.strict().parseAsync(payload);

  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  // Only compute settings update when payload.settings is provided and has keys
  let setExpression: any | undefined;
  if (payload.settings === null) {
    // Explicitly clear settings
    setExpression = null;
  } else if (payload.settings && Object.keys(payload.settings).length > 0) {
    let expr = sql`${chats.settings}`; // Start with existing value

    for (const [key, value] of Object.entries(payload.settings)) {
      if (typeof value === "object" && value !== null) {
        // Deep merge for nested objects like user_persona
        const pgPath = `{${key}}`;
        expr = sql`jsonb_set(
          ${expr},
          ${pgPath},
          COALESCE((${expr} #> ${pgPath})::jsonb, '{}') || ${JSON.stringify(
            value
          )}::jsonb
        )`;
      } else {
        // Simple set for top-level primitives (including null)
        const pgPath = `{${key}}`;
        expr = sql`jsonb_set(${expr}, ${pgPath}, ${JSON.stringify(value)}::jsonb)`;
      }
    }

    setExpression = expr;
  }

  // Build the update payload, skipping settings when not provided
  const fieldsToUpdate: Record<string, any> = {};
  if (payload.title !== undefined) {
    fieldsToUpdate.title = payload.title;
  }
  if (payload.mode !== undefined) {
    fieldsToUpdate.mode = payload.mode;
  }
  if (setExpression !== undefined) {
    fieldsToUpdate.settings = setExpression;
  }

  // No-op when nothing is provided to update
  if (Object.keys(fieldsToUpdate).length === 0) {
    return;
  }

  await db
    .update(chats)
    .set(fieldsToUpdate)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));

  // Invalidate cached chat data for this chatId
  updateTag(`chat:${chatId}`);
};
