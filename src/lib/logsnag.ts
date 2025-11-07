import "server-only";

import { LogSnag } from "@logsnag/node";

import crypto from "crypto";

const logsnag = new LogSnag({
  token: process.env.LOG_SNAG_TOKEN!,
  project: process.env.LOG_SNAG_PROJECT!,
});

function hashSensitive(value: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(value);
  return hash.digest("hex");
}

export const trackGeneratePersonaCompleted = async ({
  isAnonymous,
  userId,
  modelId,
}: {
  isAnonymous: boolean;
  userId: string;
  modelId: string;
}) => {
  const hashedUserId = hashSensitive(userId);

  await logsnag
    .track({
      channel: "personas",
      event: isAnonymous
        ? "generate-persona-anonymous-success"
        : "generate-persona-success",
      user_id: hashedUserId,
      icon: "🦔",
      tags: {
        model: modelId,
        user: hashedUserId,
      },
    })
    .catch((err) => {});
};

export const trackChatError = async ({
  userId,
  modelId,
}: {
  userId: string;
  modelId: string;
}) => {
  const hashedUserId = hashSensitive(userId);

  await logsnag
    .track({
      channel: "chats",
      event: "chat-error",
      user_id: hashedUserId,
      icon: "🚨",
      tags: {
        model: modelId,
        user: hashedUserId,
      },
    })
    .catch((err) => {});
};

export const trackChatCreated = async ({
  userId,
  chatId,
  modelId,
}: {
  userId: string;
  chatId: string;
  modelId: string;
}) => {
  const hashedUserId = hashSensitive(userId);
  const hashedChatId = hashSensitive(chatId);

  await logsnag
    .track({
      channel: "chats",
      event: "chat-created",
      user_id: hashedUserId,
      icon: "💬",
      tags: {
        chat: hashedChatId,
        model: modelId,
        user: hashedUserId,
      },
    })
    .catch((err) => {});
};

export const trackCheckoutCompleted = async ({
  userId,
  orderId,
  amount,
}: {
  userId: string;
  orderId: string;
  amount: number;
}) => {
  const hashedUserId = hashSensitive(userId);

  await logsnag
    .track({
      channel: "checkout",
      event: "checkout-completed",
      user_id: hashedUserId,
      icon: "✅",
      tags: {
        order_id: orderId,
        amount: String(amount),
        user: hashedUserId,
      },
    })
    .catch((err) => {});
};

export const trackCheckoutFailed = async ({
  userId,
  orderId,
  reason,
}: {
  userId: string;
  orderId: string;
  reason: string;
}) => {
  const hashedUserId = hashSensitive(userId);

  await logsnag
    .track({
      channel: "checkout",
      event: "checkout-failed",
      user_id: hashedUserId,
      icon: "❌",
      tags: {
        order_id: orderId,
        reason,
        user: hashedUserId,
      },
    })
    .catch((err) => {});
};

export default logsnag;
