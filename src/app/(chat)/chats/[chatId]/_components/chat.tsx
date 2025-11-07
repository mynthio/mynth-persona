"use client";

import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChat,
  useChatActions,
  useChatMessages,
  useChatStatus,
} from "@ai-sdk-tools/store";
import { DefaultChatTransport } from "ai";
import { FormEvent, useEffect, useRef, useState } from "react";

import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { ButtonGroup } from "@/components/mynth-ui/base/button-group";

import {
  ArrowsClockwiseIcon,
  CircleNotchIcon,
  PaperPlaneTiltIcon,
  SlidersHorizontalIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ChatMode } from "@/schemas/backend/chats/chat.schema";
import { nanoid } from "nanoid";
import ChatMessages from "./chat-messages";
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";
import { useChatMain } from "../_contexts/chat-main.context";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";
import { ChatModelPickerMenu } from "./chat-model-picker-menu";
import { updateChatAction } from "@/actions/update-chat.action";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import { useToast } from "@/components/ui/toast";
import {
  PromptInput,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";

type ChatProps = {
  chat: { id: string; mode: ChatMode };
  initialMessages: PersonaUIMessage[];
};

export default function Chat(props: ChatProps) {
  const { addMessageToBranch, setActiveId } = useChatBranchesContext();
  // Use non-null assertion for ref type to satisfy downstream component prop types
  const messagesContainerRef = useRef<HTMLDivElement>(null!);
  const shouldScrollRef = useRef(false);
  const setShouldScroll = (value: boolean) => {
    shouldScrollRef.current = value;
  };

  useChat({
    id: props.chat.id,

    messages: props.initialMessages,

    transport: new DefaultChatTransport<PersonaUIMessage>({
      api: `/api/chats/${props.chat.id}/chat`,

      prepareSendMessagesRequest: ({ id, messages, body }) => {
        return {
          body: {
            ...body,
            parentId: messages.at(-2)?.id ?? null,
            message:
              body?.event === "edit_message"
                ? body?.editedMessage
                : messages.at(-1),
          },
        };
      },
    }),

    onFinish: ({ message }) => {
      setActiveId(message.id);
      addMessageToBranch(message.metadata?.parentId ?? null, {
        id: message.id,
        createdAt: new Date(),
      });
    },

    generateId: () => `msg_${nanoid(32)}`,
  });

  return (
    <div className="w-full flex flex-col justify-center items-center h-full mx-auto px-[12px] md:px-0 mt-auto">
      <ChatMessages
        containerRef={messagesContainerRef}
        shouldScrollRef={shouldScrollRef}
      />
      <ChatPrompt
        messagesContainerRef={messagesContainerRef}
        shouldScrollRef={shouldScrollRef}
        setShouldScroll={setShouldScroll}
      />
    </div>
  );
}

type ChatPromptProps = {
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  shouldScrollRef: React.MutableRefObject<boolean>;
  setShouldScroll: (value: boolean) => void;
};

function ChatPrompt(props: ChatPromptProps) {
  const [text, setText] = useState<string>("");

  const { sendMessage, regenerate } = useChatActions();
  const status = useChatStatus();
  const messages = useChatMessages();

  const { openSettings } = useSettingsNavigation();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>
  ) => {
    const hasText = Boolean(message.text);

    if (!hasText) {
      return;
    }

    if (status !== "ready") {
      if (status === "error") {
        regenerate({
          body: {
            event: "regenerate",
          },
        });
      } else {
        return;
      }
    }

    // Set flag to trigger scroll after message is added
    props.setShouldScroll(true);

    sendMessage(
      {
        text,
        metadata: {
          parentId: messages.at(-1)?.id ?? null,
        },
      },
      {
        body: {
          event: "send",
        },
      }
    );

    // Clear input field
    event.currentTarget.reset();
  };

  return (
    <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
      <PromptInputHeader></PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          onChange={(e) => setText(e.target.value)}
          ref={textareaRef}
          value={text}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputSubmit disabled={!text && !status} status={status} />
      </PromptInputFooter>
    </PromptInput>
  );
}

function ChatModelSelector() {
  const { navigateSettings } = useSettingsNavigation();
  const { chatId, modelId, setModelId } = useChatMain();
  const { add } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleModelChange = async (selectedModelId: TextGenerationModelId) => {
    if (isLoading || modelId === selectedModelId) return;
    setIsLoading(true);

    const oldModelId = modelId;
    setModelId(selectedModelId);

    await updateChatAction(chatId, {
      settings: {
        model: selectedModelId,
      },
    })
      .catch(() => {
        setModelId(oldModelId);
        add({
          title: "Failed switch to model",
          description: "Try again or contact support",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <ChatModelPickerMenu
      currentModelId={modelId!}
      onModelChange={handleModelChange}
      onOpenSettings={() => navigateSettings("model")}
    />
  );
}
