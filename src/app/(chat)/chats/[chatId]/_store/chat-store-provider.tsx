"use client";

import { useContext, useEffect, useRef, type ReactNode } from "react";
import { useChat, type UseChatOptions } from "@ai-sdk/react";
import {
  createChatStore,
  ChatStoreContext,
  type ChatStore,
} from "./chat-store";
import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";

// ---------------------------------------------------------------------------
// Provider — creates a scoped store instance per chat page
// ---------------------------------------------------------------------------

type ChatStoreProviderProps = {
  children: ReactNode;
  initialMessages?: PersonaUIMessage[];
};

export function ChatStoreProvider({
  children,
  initialMessages,
}: ChatStoreProviderProps) {
  const storeRef = useRef<ChatStore>(undefined);
  if (!storeRef.current) {
    storeRef.current = createChatStore();
    // Seed messages synchronously so the first render has data
    if (initialMessages) {
      storeRef.current.setState({ messages: initialMessages });
    }
  }

  return (
    <ChatStoreContext value={storeRef.current}>
      {children}
    </ChatStoreContext>
  );
}

// ---------------------------------------------------------------------------
// Bridge — syncs @ai-sdk/react useChat → Zustand store
// ---------------------------------------------------------------------------

export function useChatBridge(options: UseChatOptions<PersonaUIMessage>) {
  const store = useContext(ChatStoreContext);
  if (!store) {
    throw new Error("useChatBridge must be used within a ChatStoreProvider");
  }

  const helpers = useChat<PersonaUIMessage>(options);

  // Sync data + action delegates into the store after every render.
  // React 18 automatic batching collapses this into a single re-render
  // for downstream subscribers.
  useEffect(() => {
    store.setState({
      id: helpers.id,
      messages: helpers.messages,
      status: helpers.status,
      error: helpers.error,
      sendMessage: helpers.sendMessage,
      regenerate: helpers.regenerate,
      stop: helpers.stop,
      setMessages: helpers.setMessages,
      clearError: helpers.clearError,
    });
  });

  return helpers;
}
