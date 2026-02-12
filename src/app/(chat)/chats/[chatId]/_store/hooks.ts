"use client";

import { useContext } from "react";
import { useStore } from "zustand/react";
import { useShallow } from "zustand/react/shallow";
import { ChatStoreContext, type ChatStore, type ChatStoreState } from "./chat-store";

// ---------------------------------------------------------------------------
// Internal context accessor
// ---------------------------------------------------------------------------

function useChatStoreContext(): ChatStore {
  const store = useContext(ChatStoreContext);
  if (!store) {
    throw new Error("Chat store hooks must be used within a ChatStoreProvider");
  }
  return store;
}

// ---------------------------------------------------------------------------
// Data hooks
// ---------------------------------------------------------------------------

export function useChatMessages() {
  return useStore(useChatStoreContext(), (s) => s.messages);
}

export function useChatStatus() {
  return useStore(useChatStoreContext(), (s) => s.status);
}

export function useChatId() {
  return useStore(useChatStoreContext(), (s) => s.id);
}

export function useChatError() {
  return useStore(useChatStoreContext(), (s) => s.error);
}

export function useMessageCount() {
  return useStore(useChatStoreContext(), (s) => s.messages.length);
}

// ---------------------------------------------------------------------------
// Computed hooks
// ---------------------------------------------------------------------------

/** Returns `true` when any activity is in progress (streaming, continuing, impersonating, etc.) */
export function useChatBusy() {
  return useStore(useChatStoreContext(), (s) =>
    s.status === "streaming" || s.status === "submitted" || s.isContinuing || s.isImpersonating
  );
}

/** Returns `true` when a new generation/stream can safely start */
export function useChatCanStream() {
  return useStore(useChatStoreContext(), (s) =>
    !( s.status === "streaming" || s.status === "submitted" || s.isContinuing || s.isImpersonating )
  );
}

// ---------------------------------------------------------------------------
// Action hooks
// ---------------------------------------------------------------------------

const actionsSelector = (s: ChatStoreState) => ({
  sendMessage: s.sendMessage,
  regenerate: s.regenerate,
  stop: s.stop,
  setMessages: s.setMessages,
});

export function useChatActions() {
  return useStore(useChatStoreContext(), useShallow(actionsSelector));
}

// ---------------------------------------------------------------------------
// Escape hatches
// ---------------------------------------------------------------------------

/** Custom selector — use when you need a derived value with minimal re-renders */
export function useChatStore<T>(selector: (state: ChatStoreState) => T): T {
  return useStore(useChatStoreContext(), selector);
}

/** Raw store API for imperative `getState()` access — no subscription */
export function useChatStoreApi() {
  return useChatStoreContext();
}
