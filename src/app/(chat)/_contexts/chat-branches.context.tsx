"use client";

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { useLocalStorage } from "@uidotdev/usehooks";

// Selection-only context: manages active branch ID per chat (persisted in localStorage)
export interface ChatBranchesContextValue {
  branchId: string | undefined;
  setActiveId: (id?: string) => void;
}

const ChatBranchesContext = createContext<ChatBranchesContextValue | undefined>(
  undefined
);

export function ChatBranchesProvider({
  chatId,
  children,
}: {
  chatId: string | null | undefined;
  children: ReactNode;
}) {
  // Persisted branch selection per chat
  const [branchId, setBranchId] = useLocalStorage<string | undefined>(
    `chat_${chatId}_branch`
  );

  const setActiveId = useCallback(
    (id?: string) => {
      setBranchId(id);
    },
    [setBranchId]
  );

  const value = useMemo<ChatBranchesContextValue>(
    () => ({
      branchId,
      setActiveId,
    }),
    [branchId, setActiveId]
  );

  return (
    <ChatBranchesContext.Provider value={value}>
      {children}
    </ChatBranchesContext.Provider>
  );
}

export function useChatBranchesContext() {
  const ctx = useContext(ChatBranchesContext);
  if (!ctx) {
    throw new Error(
      "useChatBranchesContext must be used within a ChatBranchesProvider"
    );
  }
  return ctx;
}
