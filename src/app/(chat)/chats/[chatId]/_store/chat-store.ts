import { createContext } from "react";
import { createStore as createZustandStore } from "zustand/vanilla";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { ChatStatus } from "ai";
import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionDelegates = Pick<
  UseChatHelpers<PersonaUIMessage>,
  "sendMessage" | "regenerate" | "stop" | "setMessages" | "clearError"
>;

export type ChatStoreState = {
  id: string | undefined;
  messages: PersonaUIMessage[];
  status: ChatStatus;
  error: Error | undefined;
} & ActionDelegates;

export type ChatStore = ReturnType<typeof createChatStore>;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

const noop = () => {};
const asyncNoop = async () => {};

export function createChatStore() {
  return createZustandStore<ChatStoreState>(() => ({
    // Data (overwritten by bridge on every sync)
    id: undefined,
    messages: [],
    status: "ready" as ChatStatus,
    error: undefined,

    // Action delegates (overwritten by bridge once useChat initialises)
    sendMessage: asyncNoop as ChatStoreState["sendMessage"],
    regenerate: asyncNoop as ChatStoreState["regenerate"],
    stop: asyncNoop,
    setMessages: noop as ChatStoreState["setMessages"],
    clearError: noop,
  }));
}

// ---------------------------------------------------------------------------
// Context (scoped per chat page — not global)
// ---------------------------------------------------------------------------

export const ChatStoreContext = createContext<ChatStore | null>(null);
