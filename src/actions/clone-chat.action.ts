"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { chats, chatPersonas, messages } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { chatIdSchema } from "@/schemas/backend/chats/chat.schema";
import { redis } from "@/lib/redis";

type SourceMessage = {
  id: string;
  parentId: string | null;
  chatId: string;
  role: string;
  parts: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function coerceDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function sortMessagesForClone(messagesToSort: SourceMessage[]) {
  const messagesById = new Map(
    messagesToSort.map((message) => [message.id, message]),
  );
  const childrenByParent = new Map<string | null, SourceMessage[]>();

  for (const message of messagesToSort) {
    const parentKey = message.parentId;
    const siblings = childrenByParent.get(parentKey);

    if (siblings) {
      siblings.push(message);
    } else {
      childrenByParent.set(parentKey, [message]);
    }
  }

  const sortByCreatedAt = (a: SourceMessage, b: SourceMessage) => {
    const timeDiff =
      coerceDate(a.createdAt).getTime() - coerceDate(b.createdAt).getTime();
    return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
  };

  for (const siblings of childrenByParent.values()) {
    siblings.sort(sortByCreatedAt);
  }

  const ordered: SourceMessage[] = [];
  const visited = new Set<string>();

  const visit = (message: SourceMessage) => {
    if (visited.has(message.id)) {
      return;
    }

    visited.add(message.id);
    ordered.push(message);

    for (const child of childrenByParent.get(message.id) ?? []) {
      visit(child);
    }
  };

  const roots = messagesToSort
    .filter(
      (message) =>
        message.parentId === null || !messagesById.has(message.parentId),
    )
    .sort(sortByCreatedAt);

  for (const root of roots) {
    visit(root);
  }

  for (const message of [...messagesToSort].sort(sortByCreatedAt)) {
    visit(message);
  }

  return ordered;
}

function remapMessageMetadata(
  metadata: unknown,
  idMap: Map<string, string>,
  sourceMessage: SourceMessage,
  newMessageId: string,
) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return metadata;
  }

  const originalMetadata = metadata as Record<string, unknown>;
  const remappedMetadata: Record<string, unknown> = {
    ...originalMetadata,
    parentId: sourceMessage.parentId
      ? (idMap.get(sourceMessage.parentId) ?? null)
      : null,
  };

  if (
    typeof originalMetadata.messageId === "string" &&
    originalMetadata.messageId === sourceMessage.id
  ) {
    remappedMetadata.messageId = newMessageId;
  }

  const checkpoint = originalMetadata.checkpoint;
  if (
    checkpoint &&
    typeof checkpoint === "object" &&
    !Array.isArray(checkpoint)
  ) {
    const checkpointData = checkpoint as Record<string, unknown>;
    remappedMetadata.checkpoint = {
      ...checkpointData,
      parentCheckpointMessageId:
        typeof checkpointData.parentCheckpointMessageId === "string"
          ? (idMap.get(checkpointData.parentCheckpointMessageId) ?? null)
          : checkpointData.parentCheckpointMessageId,
    };
  }

  return remappedMetadata;
}

export async function cloneChatAction({
  chatId,
  title,
  activeBranchOnly,
  leafId,
}: {
  chatId: string;
  title: string;
  activeBranchOnly: boolean;
  leafId?: string;
}) {
  await chatIdSchema.parseAsync(chatId);

  const { userId } = await auth.protect();

  // Verify ownership
  const sourceChat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
  });

  if (!sourceChat) {
    throw new Error("Chat not found");
  }

  // Fetch chat personas
  const sourceChatPersonas = await db.query.chatPersonas.findMany({
    where: eq(chatPersonas.chatId, chatId),
  });

  // Fetch messages
  let sourceMessages: SourceMessage[];
  let resolvedLeafId: string | null = null;

  if (activeBranchOnly) {
    // Resolve leaf ID if not provided
    resolvedLeafId = leafId ?? null;
    if (!resolvedLeafId) {
      resolvedLeafId = (await redis.get<string>(`chat:${chatId}:leaf`)) ?? null;
    }

    if (!resolvedLeafId) {
      // Fallback: find the latest leaf from DB
      const latestMsg = await db.query.messages.findFirst({
        where: eq(messages.chatId, chatId),
        orderBy: (m, { desc }) => [desc(m.createdAt), desc(m.id)],
        columns: { id: true },
      });
      resolvedLeafId = latestMsg?.id ?? null;
    }

    if (resolvedLeafId) {
      const result = await db.execute(
        sql<{
          id: string;
          parent_id: string | null;
          chat_id: string;
          role: string;
          parts: unknown;
          metadata: unknown;
          created_at: Date | string;
          updated_at: Date | string;
        }>`
          with recursive thread as (
            select m.id, m.parent_id, m.chat_id, m.role, m.parts, m.metadata, m.created_at, m.updated_at
            from messages m
            where m.id = ${resolvedLeafId} and m.chat_id = ${chatId}
            union all
            select pm.id, pm.parent_id, pm.chat_id, pm.role, pm.parts, pm.metadata, pm.created_at, pm.updated_at
            from messages pm
            join thread on thread.parent_id = pm.id
          )
          select * from thread
        `,
      );
      const threadRows = result.rows as {
        id: string;
        parent_id: string | null;
        chat_id: string;
        role: string;
        parts: unknown;
        metadata: unknown;
        created_at: Date | string;
        updated_at: Date | string;
      }[];

      sourceMessages = threadRows.map((row) => ({
        id: row.id,
        parentId: row.parent_id,
        chatId: row.chat_id,
        role: row.role,
        parts: row.parts,
        metadata: row.metadata,
        createdAt: coerceDate(row.created_at),
        updatedAt: coerceDate(row.updated_at),
      }));
    } else {
      sourceMessages = [];
    }
  } else {
    // All messages
    const allMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, chatId),
      orderBy: [asc(messages.createdAt), asc(messages.id)],
    });

    sourceMessages = allMessages.map((message) => ({
      id: message.id as string,
      parentId: message.parentId as string | null,
      chatId: message.chatId as string,
      role: message.role as string,
      parts: message.parts,
      metadata: message.metadata,
      createdAt: coerceDate(message.createdAt as Date | string),
      updatedAt: coerceDate(message.updatedAt as Date | string),
    }));
  }

  const orderedSourceMessages = sortMessagesForClone(sourceMessages);

  // Build ID map
  const newChatId = `pch_${nanoid()}`;
  const idMap = new Map<string, string>();

  for (const msg of orderedSourceMessages) {
    idMap.set(msg.id, `msg_${nanoid(32)}`);
  }

  // Remap messages
  const remappedMessages = orderedSourceMessages.map((msg) => {
    const newMessageId = idMap.get(msg.id)!;

    return {
      id: newMessageId,
      parentId: msg.parentId ? (idMap.get(msg.parentId) ?? null) : null,
      chatId: newChatId,
      role: msg.role,
      parts: msg.parts,
      metadata: remapMessageMetadata(msg.metadata, idMap, msg, newMessageId),
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    };
  });

  // Preserve the currently selected leaf whenever it is part of the cloned set
  const preferredLeafId =
    (leafId && idMap.has(leafId) ? leafId : null) ??
    (resolvedLeafId && idMap.has(resolvedLeafId) ? resolvedLeafId : null);

  let newLeafId: string | null = preferredLeafId
    ? (idMap.get(preferredLeafId) ?? null)
    : null;

  if (!newLeafId && orderedSourceMessages.length > 0) {
    const latestMsg = orderedSourceMessages.reduce((latest, msg) =>
      coerceDate(msg.createdAt) > coerceDate(latest.createdAt) ? msg : latest,
    );
    newLeafId = idMap.get(latestMsg.id) ?? null;
  }

  await db.transaction(async (tx) => {
    // Insert new chat
    await tx.insert(chats).values({
      id: newChatId,
      userId,
      title,
      mode: sourceChat.mode,
      settings: sourceChat.settings,
    });

    // Insert chat personas
    if (sourceChatPersonas.length > 0) {
      await tx.insert(chatPersonas).values(
        sourceChatPersonas.map((cp) => ({
          chatId: newChatId,
          personaId: cp.personaId,
          personaVersionId: cp.personaVersionId,
          settings: cp.settings,
        })),
      );
    }

    // Batch insert messages
    if (remappedMessages.length > 0) {
      // Insert in chunks to avoid oversized queries while keeping parent rows first
      const CHUNK_SIZE = 500;
      for (let i = 0; i < remappedMessages.length; i += CHUNK_SIZE) {
        const chunk = remappedMessages.slice(i, i + CHUNK_SIZE);
        await tx.insert(messages).values(chunk);
      }
    }
  });

  // Set leaf in Redis
  if (newLeafId) {
    await redis.set(`chat:${newChatId}:leaf`, newLeafId);
  }

  return { id: newChatId };
}
