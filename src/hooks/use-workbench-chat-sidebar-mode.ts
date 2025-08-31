"use client";

import { useQueryState } from "nuqs";

export function useWorkbenchChatSidebarMode() {
  return useQueryState("chatSidebarMode", {
    defaultValue: "chats",
    clearOnDefault: true,
  });
}
