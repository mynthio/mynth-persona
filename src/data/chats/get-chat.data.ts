"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

/**
 * Cache TTL for chat data (2 hours).
 * Chats are frequently accessed during active sessions but inactive afterwards.
 * This prevents stale cache entries from persisting indefinitely.
 */
const CHAT_CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours

/**
 * Cached chat fetch using Next.js Data Cache with tag-based revalidation.
 * Returns chat with roleplayData for AI text generation (used in chat API route).
 *
 * Cache key includes chatId and userId to ensure per-user isolation.
 * Invalidate via `updateTag(\`chat:${chatId}\`)` in server actions after any chat mutation.
 */
export async function getChatByIdForUserCached(chatId: string, userId: string) {
  const runner = unstable_cache(
    async () => {
      return db.query.chats.findFirst({
        where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
        with: {
          chatPersonas: {
            columns: {
              settings: true,
            },
            with: {
              personaVersion: {
                columns: {
                  roleplayData: true,
                  personaId: true,
                },
              },
            },
          },
        },
      });
    },
    ["chat:by-id", chatId, userId, "with:personas:version:minimal"],
    {
      tags: [`chat:${chatId}`],
      revalidate: CHAT_CACHE_TTL_SECONDS,
    }
  );

  return runner();
}

/**
 * Cached chat fetch for page component rendering.
 * Returns chat with persona version data (name, etc.) and profile image for display.
 *
 * Invalidate via `updateTag(\`chat:${chatId}\`)` in server actions after any chat mutation.
 */
export async function getChatForPageCached(chatId: string, userId: string) {
  const runner = unstable_cache(
    async () => {
      return db.query.chats.findFirst({
        where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
        with: {
          chatPersonas: {
            columns: {},
            with: {
              persona: {
                columns: {
                  profileImageIdMedia: true,
                },
              },
              personaVersion: {
                columns: {
                  id: true,
                  personaId: true,
                  data: true,
                },
              },
            },
          },
        },
      });
    },
    ["chat:for-page", chatId, userId],
    {
      tags: [`chat:${chatId}`],
      revalidate: CHAT_CACHE_TTL_SECONDS,
    }
  );

  return runner();
}

/**
 * Lightweight cached validation to check if a chat exists and belongs to a user.
 * Returns minimal chat data (id only) for ownership verification.
 *
 * Use this in routes/actions that only need to validate ownership before proceeding.
 * Invalidate via `updateTag(\`chat:${chatId}\`)` in server actions after any chat mutation.
 */
export async function validateChatOwnershipCached(
  chatId: string,
  userId: string
) {
  const runner = unstable_cache(
    async () => {
      return db.query.chats.findFirst({
        where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
        columns: { id: true },
      });
    },
    ["chat:validate-ownership", chatId, userId],
    {
      tags: [`chat:${chatId}`],
      revalidate: CHAT_CACHE_TTL_SECONDS,
    }
  );

  return runner();
}

/**
 * Cached chat fetch that returns the chat with its settings.
 * Useful for image generation actions that need to check chat settings.
 *
 * Invalidate via `updateTag(\`chat:${chatId}\`)` in server actions after any chat mutation.
 */
export async function getChatWithSettingsCached(
  chatId: string,
  userId: string
) {
  const runner = unstable_cache(
    async () => {
      return db.query.chats.findFirst({
        where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
      });
    },
    ["chat:with-settings", chatId, userId],
    {
      tags: [`chat:${chatId}`],
      revalidate: CHAT_CACHE_TTL_SECONDS,
    }
  );

  return runner();
}
