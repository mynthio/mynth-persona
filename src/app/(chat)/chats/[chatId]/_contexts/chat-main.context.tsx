"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type {
  ChatMode,
  ChatSettings,
} from "@/schemas/backend/chats/chat.schema";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";

export interface ChatContextValue {
  chatId: string;
  mode: ChatMode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setMode: (mode: ChatMode) => void;
  settings: ChatSettings;
  modelId?: TextGenerationModelId;
  editMessageId: string | null;
  setSettings: (settings: ChatSettings) => void;
  setEditMessageId: (id: string | null) => void;
  setModelId: (id?: TextGenerationModelId) => void;
}

const ChatMainContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatMainProvider({
  chatId,
  mode: initialMode,
  initialModelId,
  initialSettings,
  children,
}: {
  chatId: string;
  mode: ChatMode;
  initialModelId?: TextGenerationModelId;
  initialSettings: ChatSettings;
  children: ReactNode;
}) {
  const [modeState, setModeState] = useState<ChatMode>(initialMode);

  const setMode = useCallback((mode: ChatMode) => {
    setModeState(mode);
  }, []);

  const [modelId, setModelIdState] = useState<
    TextGenerationModelId | undefined
  >(initialModelId);

  const setModelId = useCallback((id?: TextGenerationModelId) => {
    setModelIdState(id);
  }, []);

  const [settings, setSettingsState] = useState<ChatSettings>(initialSettings);

  const setSettings = useCallback((settings: ChatSettings) => {
    setSettingsState(settings);
  }, []);

  const [editMessageId, setEditMessageIdState] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpenState] = useState<boolean>(true);

  const setSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpenState(open);
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      chatId,
      mode: modeState,
      sidebarOpen,
      setSidebarOpen,
      setMode,
      settings,
      modelId,
      setModelId,
      editMessageId,
      setEditMessageId: setEditMessageIdState,
      setSettings,
    }),
    [
      chatId,
      modeState,
      sidebarOpen,
      setSidebarOpen,
      setMode,
      settings,
      modelId,
      setModelId,
      editMessageId,
      setEditMessageIdState,
      setSettings,
    ]
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
