"use client";

import { pinMessageAction } from "@/actions/pin-message.action";
import {
  usePinnedMessagesQuery,
  type PinnedMessage,
} from "@/app/_queries/use-pinned-messages.query";

export type { PinnedMessage };

export function usePinnedBranches(chatId: string) {
  const { data, isLoading, mutate } = usePinnedMessagesQuery(chatId);

  const pinnedBranches: PinnedMessage[] = data?.data ?? [];

  async function pinMessage(messageId: string, label?: string) {
    await pinMessageAction({
      messageId,
      chatId,
      pinned: true,
      pinnedLabel: label,
    });
    await mutate();
  }

  async function unpinMessage(messageId: string) {
    await pinMessageAction({ messageId, chatId, pinned: false });
    await mutate();
  }

  return { pinnedBranches, pinMessage, unpinMessage, isLoading };
}
