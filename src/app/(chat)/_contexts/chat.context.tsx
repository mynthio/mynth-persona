"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Chat } from "@ai-sdk/react";
import { ChatOnFinishCallback, DefaultChatTransport } from "ai";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { nanoid } from "nanoid";
import useSWR, { useSWRConfig } from "swr";
import { MessageBranchesByParent } from "@/schemas";
import { addItemToCollection } from "@/lib/utils";

interface ChatContextValue {
  // replace with your custom message type
  chat: Chat<PersonaUIMessage>;
  branches?: MessageBranchesByParent;
  branchesIsLoading: boolean;
  addItemToBranch: (
    parentId: string,
    item: { id: string; createdAt: Date }
  ) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

type CreateChatOptionsArgs = {
  onFinish?: ChatOnFinishCallback<PersonaUIMessage>;
};

function createChat(options: CreateChatOptionsArgs) {
  return new Chat<PersonaUIMessage>({
    generateId: () => `msg_${nanoid(22)}`,

    onFinish: options.onFinish,

    transport: new DefaultChatTransport({
      api: `/api/chats/new/chat`,

      prepareSendMessagesRequest({ messages, body }) {
        const chatId = body?.chatId;

        if (!chatId) {
          throw new Error("chatId is required");
        }

        return {
          api: `/api/chats/${chatId}/chat`,
          body: {
            messages: [messages.at(-1)],
            parentId: messages.at(-2)?.id ?? null,
            ...body,
          },
        };
      },
    }),
  });
}

type ChatProviderProps = {
  children: ReactNode;
  chatId?: string;
};

export function ChatProvider({ children, chatId }: ChatProviderProps) {
  const swrConfig = useSWRConfig();

  const { data: branchesData, isLoading: branchesIsLoading } =
    useSWR<MessageBranchesByParent>(
      chatId ? `/api/chats/${chatId}/branches` : null,
      {
        revalidateIfStale: false,
        revalidateOnMount: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );

  // Keep latest chatId and mutate in refs to avoid stale closure without recreating Chat instance
  const chatIdRef = useRef<string | undefined>(chatId);
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  const mutateRef = useRef(swrConfig.mutate);
  useEffect(() => {
    mutateRef.current = swrConfig.mutate;
  }, [swrConfig.mutate]);

  const addItemToBranch = useCallback(
    (parentId: string, item: { id: string; createdAt: Date }) => {
      const currentChatId = chatIdRef.current;
      if (!currentChatId) return;
      mutateRef.current(`/api/chats/${currentChatId}/branches`, (prev: any) =>
        addItemToCollection(prev, parentId, item)
      );
    },
    []
  );

  const onMessageStreamFinishCallback: ChatOnFinishCallback<PersonaUIMessage> =
    useCallback((data) => {
      const currentChatId = chatIdRef.current;
      console.log(`[${currentChatId}] onMessageStreamFinishCallback`, data);

      const regeneratedForId = data.message.metadata?.regeneratedForId;

      if (regeneratedForId && currentChatId) {
        /**
         * Use global mutate to prevent issues when switching chats
         */
        mutateRef.current(`/api/chats/${currentChatId}/branches`, (prev: any) =>
          addItemToCollection(prev, regeneratedForId, {
            id: data.message.id,
            createdAt: new Date(),
          })
        );
      }
    }, []);

  // Keep Chat instance stable to avoid interrupting streaming
  const [chat] = useState(() =>
    createChat({ onFinish: onMessageStreamFinishCallback })
  );

  return (
    <ChatContext.Provider
      value={{
        chat,
        branches: branchesData,
        branchesIsLoading: !!branchesIsLoading,
        addItemToBranch,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useSharedChatContext must be used within a ChatProvider");
  }
  return context;
}
