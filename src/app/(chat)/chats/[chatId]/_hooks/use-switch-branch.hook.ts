"use client";

import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { useChatActions } from "../_store/hooks";

export function useSwitchBranch() {
  const { setActiveId, prepareScrollRestore, setIsSwitchingBranch } =
    useChatBranchesContext();
  const { chatId } = useChatMain();
  const { setMessages } = useChatActions();

  const switchBranch = async (
    messageId: string | null,
    options?: { parentId?: string | null },
  ) => {
    if (options?.parentId !== undefined) {
      prepareScrollRestore(options.parentId);
    }
    setIsSwitchingBranch(true);

    try {
      // null messageId → fetch latest thread (no messageId param)
      const url = messageId
        ? `/api/chats/${chatId}/messages?messageId=${messageId}`
        : `/api/chats/${chatId}/messages`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.messages?.length > 0) {
        setActiveId(data.leafId);
        setMessages(data.messages);
      } else {
        // No messages left (empty chat)
        setActiveId(undefined);
        setMessages([]);
      }
    } finally {
      setIsSwitchingBranch(false);
    }
  };

  return switchBranch;
}
