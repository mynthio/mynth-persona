"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

// Cached chat fetch using Next.js Data Cache with tag-based revalidation.
// The cache key includes chatId and userId to ensure per-user isolation.
// Invalidate via updateTag(`chat:${chatId}`) in server actions after any chat mutation.
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
      tags: [
        // Tag scoped by chat so specific chat updates can invalidate the cache
        `chat:${chatId}`,
      ],
    }
  );

  return runner();
}