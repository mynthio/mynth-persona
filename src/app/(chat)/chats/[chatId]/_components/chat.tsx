"use client";

import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChat,
  useChatActions,
  useChatMessages,
  useChatStatus,
} from "@ai-sdk-tools/store";
import { DefaultChatTransport } from "ai";
import { FormEvent, useRef, useState } from "react";

import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import TextareaAutosize from "react-textarea-autosize";

import { StopIcon } from "@phosphor-icons/react/dist/ssr";
import { ChatMode } from "@/schemas/backend/chats/chat.schema";
import { nanoid } from "nanoid";
import ChatMessages from "./chat-messages";
import { useChatMain } from "../_contexts/chat-main.context";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";
import { ChatModelPickerMenu } from "./chat-model-picker-menu";
import { updateChatAction } from "@/actions/update-chat.action";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import { toast } from "sonner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Send01 } from "@untitledui/icons";

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
    <div className="w-full flex flex-col justify-center items-center h-full mx-auto px-[12px] md:px-0 mt-auto relative z-0">
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

  const { sendMessage, regenerate, stop } = useChatActions();
  const status = useChatStatus();
  const messages = useChatMessages();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const hasText = Boolean(text.trim());

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
    setText("");
    event.currentTarget.reset();
  };

  return (
    <div className="sticky bottom-4 grid w-full max-w-xl gap-6 z-10 mt-auto">
      <form onSubmit={handleSubmit} className="w-full">
        <InputGroup className="dark:bg-input/30 backdrop-blur-3xl rounded-3xl">
          <TextareaAutosize
            ref={textareaRef}
            data-slot="input-group-control"
            className="flex field-sizing-content min-h-16 w-full resize-none rounded-3xl bg-transparent px-6 py-4.5 text-base transition-[color,box-shadow] outline-none text-[1.05rem]"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <InputGroupAddon align="block-end" className="items-end">
            <ChatModelSelector />

            {status === "streaming" || status === "submitted" ? (
              <InputGroupButton
                variant="default"
                className="ml-auto size-9 rounded-xl"
                onClick={stop}
                type="button"
              >
                <StopIcon weight="fill" className="size-4" />
                <span className="sr-only">Stop generation</span>
              </InputGroupButton>
            ) : (
              <InputGroupButton
                variant="default"
                className="ml-auto size-9 rounded-xl"
                type="submit"
              >
                <Send01 strokeWidth={1.5} />
                <span className="sr-only">Send</span>
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  );
}

function ChatModelSelector() {
  const { navigateSettings } = useSettingsNavigation();
  const { chatId, modelId, setModelId } = useChatMain();
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
        toast.error("Failed switch to model", {
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
