"use client";

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
  useState,
} from "react";
import { useLocalStorage } from "@uidotdev/usehooks";
import { BranchesByParent } from "@/services/chat/get-chat-branches";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";

// Selection-only context: manages active branch ID per chat (persisted in localStorage)
export interface ChatBranchesContextValue {
  branchId: string | undefined;
  branches: BranchesByParent;
  setActiveId: (id?: string) => void;
  addMessageToBranch: (
    parentId: string | null | undefined,
    message: { id: string; createdAt: string | Date }
  ) => void;
}

const ChatBranchesContext = createContext<ChatBranchesContextValue | undefined>(
  undefined
);

export function ChatBranchesProvider({
  chatId,
  branches,
  activeBranch,
  children,
}: {
  chatId: string;
  branches: BranchesByParent;
  activeBranch: string | null;
  children: ReactNode;
}) {
  // Persisted branch selection per chat
  const [branchId, setBranchId] = useState(activeBranch);
  const [branchesState, setBranchesState] =
    useState<BranchesByParent>(branches);

  const setActiveId = useCallback(
    (id?: string) => {
      setBranchId(id ?? null);
    },
    [setBranchId]
  );

  const addMessageToBranch = useCallback(
    (
      parentId: string | null | undefined,
      message: { id: string; createdAt: string | Date }
    ) => {
      setBranchesState((prev) => {
        const key = parentId ?? ROOT_BRANCH_PARENT_ID;
        const branch = prev[key] ?? [];
        const exists = branch.some((m) => m.id === message.id);
        if (exists) return prev;

        const updatedBranch = [
          ...branch,
          { id: message.id, createdAt: message.createdAt },
        ];
        const sortedBranch = [...updatedBranch].sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return aTime - bTime;
        });

        return { ...prev, [key]: sortedBranch };
      });
    },
    [setBranchesState]
  );

  const value = useMemo<ChatBranchesContextValue>(
    () => ({
      branchId: branchId ?? undefined,
      setActiveId,
      branches: branchesState,
      addMessageToBranch,
    }),
    [branchId, setActiveId, branchesState, addMessageToBranch]
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
