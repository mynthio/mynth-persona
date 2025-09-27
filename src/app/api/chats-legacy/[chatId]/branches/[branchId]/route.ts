import "server-only";

import { db } from "@/db/drizzle";
import { chats, messages } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, asc, isNull } from "drizzle-orm";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";

// GET /api/chats/:chatId/branches/:branchId
// branchId is the parentId for messages in this branch
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string; branchId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { chatId, branchId } = await params;

  // Validate chat belongs to user
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
    columns: { id: true },
  });

  if (!chat) {
    return new Response("Chat not found", { status: 404 });
  }

  const isRootBranch = branchId === ROOT_BRANCH_PARENT_ID;

  // For root branch previews, we don't have a parent message to validate.
  if (isRootBranch) {
    const siblings = await db.query.messages.findMany({
      where: and(eq(messages.chatId, chatId), isNull(messages.parentId)),
      columns: {
        id: true,
        role: true,
        parts: true,
        createdAt: true,
      },
      orderBy: [asc(messages.createdAt)],
    });

    const extractText = (parts: unknown): string => {
      try {
        if (Array.isArray(parts)) {
          return parts
            .map((p: any) => {
              if (!p || typeof p !== "object") return "";
              if (p.type === "text" && typeof p.text === "string") {
                return p.text;
              }
              return "";
            })
            .filter(Boolean)
            .join("\n\n");
        }

        if (parts && typeof parts === "object") {
          const p: any = parts as any;
          if (p.type === "text" && typeof p.text === "string") return p.text;
          return "";
        }

        return "";
      } catch {
        return "";
      }
    };

    const MAX_PREVIEW_CHARS = 1200;

    const previews = siblings.map((m) => {
      const fullText = extractText(m.parts);
      const preview =
        fullText.length > MAX_PREVIEW_CHARS
          ? fullText.slice(0, MAX_PREVIEW_CHARS)
          : fullText;

      return {
        id: m.id,
        role: m.role,
        preview,
        createdAt: m.createdAt,
      };
    });

    return Response.json(previews);
  }

  // Validate branch (parent message) exists and belongs to chat
  const parent = await db.query.messages.findFirst({
    where: and(eq(messages.id, branchId), eq(messages.chatId, chatId)),
    columns: { id: true },
  });

  if (!parent) {
    return new Response("Branch not found", { status: 404 });
  }

  // Fetch all messages that belong to this branch (same parent_id)
  const siblings = await db.query.messages.findMany({
    where: and(eq(messages.chatId, chatId), eq(messages.parentId, branchId)),
    columns: {
      id: true,
      role: true,
      parts: true,
      createdAt: true,
    },
    orderBy: [asc(messages.createdAt)],
  });

  // Utility to extract text content from the message parts
  const extractText = (parts: unknown): string => {
    try {
      // Only include parts where type === 'text'
      if (Array.isArray(parts)) {
        return parts
          .map((p: any) => {
            if (!p || typeof p !== "object") return "";
            if (p.type === "text" && typeof p.text === "string") {
              return p.text;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n\n");
      }

      if (parts && typeof parts === "object") {
        const p: any = parts as any;
        if (p.type === "text" && typeof p.text === "string") return p.text;
        return "";
      }

      // Ignore primitives and anything else
      return "";
    } catch {
      return "";
    }
  };

  const MAX_PREVIEW_CHARS = 1200; // ~3-5 paragraphs depending on text density

  const previews = siblings.map((m) => {
    const fullText = extractText(m.parts);
    const preview =
      fullText.length > MAX_PREVIEW_CHARS
        ? fullText.slice(0, MAX_PREVIEW_CHARS)
        : fullText;

    return {
      id: m.id,
      role: m.role,
      preview,
      createdAt: m.createdAt,
    };
  });

  return Response.json(previews);
}
