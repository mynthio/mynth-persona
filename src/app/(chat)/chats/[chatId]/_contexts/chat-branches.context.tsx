"use client";

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
  useState,
  useRef,
} from "react";
import { BranchesByParent } from "@/services/chat/get-chat-branches";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";

// Scroll restoration info for branch switching
export interface ScrollRestoreInfo {
  parentId: string | null;
  offsetFromTop: number;
}

// Selection-only context: manages active branch ID per chat (persisted in localStorage)
export interface ChatBranchesContextValue {
  branchId: string | undefined;
  branches: BranchesByParent;
  setActiveId: (id?: string) => void;
  addMessageToBranch: (
    parentId: string | null | undefined,
    message: { id: string; createdAt: string | Date }
  ) => void;
  // Scroll restoration for branch switching
  scrollRestoreRef: React.MutableRefObject<ScrollRestoreInfo | null>;
  prepareScrollRestore: (parentId: string | null) => void;
  // Loading state for branch switching
  isSwitchingBranch: boolean;
  setIsSwitchingBranch: (value: boolean) => void;
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
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);

  // Ref to store pending scroll restoration info
  const scrollRestoreRef = useRef<ScrollRestoreInfo | null>(null);

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

  // Prepare scroll restoration before branch switch
  // Captures the parent message's position relative to viewport
  const prepareScrollRestore = useCallback((parentId: string | null) => {
    // Find the parent message element
    const selector = parentId
      ? `[data-message-id="${parentId}"]`
      : null;

    if (selector) {
      const parentElement = document.querySelector(selector);
      if (parentElement) {
        const rect = parentElement.getBoundingClientRect();
        scrollRestoreRef.current = {
          parentId,
          offsetFromTop: rect.top,
        };
        return;
      }
    }

    // Fallback: store current scroll position
    scrollRestoreRef.current = {
      parentId,
      offsetFromTop: 0,
    };
  }, []);

  const value = useMemo<ChatBranchesContextValue>(
    () => ({
      branchId: branchId ?? undefined,
      setActiveId,
      branches: branchesState,
      addMessageToBranch,
      scrollRestoreRef,
      prepareScrollRestore,
      isSwitchingBranch,
      setIsSwitchingBranch,
    }),
    [branchId, setActiveId, branchesState, addMessageToBranch, prepareScrollRestore, isSwitchingBranch]
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
