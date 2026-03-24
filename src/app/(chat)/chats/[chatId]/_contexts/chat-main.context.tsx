"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type {
  ChatMode,
  ChatSettings,
} from "@/schemas/backend/chats/chat.schema";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useAuthorNoteHistory,
  type AuthorNoteHistoryItem,
} from "../_hooks/use-author-note-history.hook";

export interface ChatContextValue {
  chatId: string;
  title: string;
  mode: ChatMode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setMode: (mode: ChatMode) => void;
  settings: ChatSettings;
  modelId?: TextGenerationModelId;
  editMessageId: string | null;
  authorNote: string | null;
  authorNoteHistory: AuthorNoteHistoryItem[];
  setSettings: (settings: ChatSettings) => void;
  setEditMessageId: (id: string | null) => void;
  setModelId: (id?: TextGenerationModelId) => void;
  setAuthorNote: (note: string | null) => void;
  addAuthorNoteToHistory: () => void;
}

const ChatMainContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatMainProvider({
  chatId,
  title,
  mode: initialMode,
  initialModelId,
  initialSettings,
  children,
}: {
  chatId: string;
  title: string;
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

  const [authorNote, setAuthorNoteState] = useState<string | null>(
    initialSettings.author_note ?? null,
  );

  const authorNoteRef = useRef(authorNote);
  useEffect(() => {
    authorNoteRef.current = authorNote;
  }, [authorNote]);

  const setAuthorNote = useCallback((note: string | null) => {
    setAuthorNoteState(note);
  }, []);

  const { history: authorNoteHistory, addToHistory } = useAuthorNoteHistory();

  const addAuthorNoteToHistory = useCallback(() => {
    const note = authorNoteRef.current;
    if (note) {
      addToHistory(note);
    }
  }, [addToHistory]);

  const isMobile = useIsMobile();
  // On mobile, sidebar is hidden by default; on desktop, it's open by default
  const [sidebarOpen, setSidebarOpenState] = useState<boolean>(() => {
    // We can't reliably detect mobile on initial render, so default to true
    // The mobile detection will happen client-side
    return true;
  });

  // Initialize sidebar state based on mobile detection
  useEffect(() => {
    if (isMobile) {
      setSidebarOpenState(false);
    }
  }, [isMobile]);

  const setSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpenState(open);
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      chatId,
      title,
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
      authorNote,
      authorNoteHistory,
      setAuthorNote,
      addAuthorNoteToHistory,
    }),
    [
      chatId,
      title,
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
      authorNote,
      authorNoteHistory,
      setAuthorNote,
      addAuthorNoteToHistory,
    ],
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
