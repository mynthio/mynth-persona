"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { ChatMode } from "@/schemas/backend/chats/chat.schema";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";

export interface ChatContextValue {
  chatId: string;
  mode: ChatMode;
  modelId?: TextGenerationModelId;
  editMessageId: string | null;
  setEditMessageId: (id: string | null) => void;
  setModelId: (id?: TextGenerationModelId) => void;
}

const ChatMainContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatMainProvider({
  chatId,
  mode,
  initialModelId,
  children,
}: {
  chatId: string;
  mode: ChatMode;
  initialModelId?: TextGenerationModelId;
  children: ReactNode;
}) {
  const [modelId, setModelIdState] = useState<
    TextGenerationModelId | undefined
  >(initialModelId);

  const setModelId = useCallback((id?: TextGenerationModelId) => {
    setModelIdState(id);
  }, []);

  const [editMessageId, setEditMessageIdState] = useState<string | null>(null);

  const value = useMemo<ChatContextValue>(
    () => ({
      chatId,
      mode,
      modelId,
      setModelId,
      editMessageId,
      setEditMessageId: setEditMessageIdState,
    }),
    [chatId, mode, modelId, setModelId, editMessageId, setEditMessageIdState]
  );

  return (
    <ChatMainContext.Provider value={value}>
      {children}
    </ChatMainContext.Provider>
  );
}

export function useChatMain() {
  const ctx = useContext(ChatMainContext);
  if (!ctx) {
    throw new Error("useChatMain must be used within a ChatMainProvider");
  }
  return ctx;
}
