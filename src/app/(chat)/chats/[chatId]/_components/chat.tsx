"use client";

import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChat,
  useChatActions,
  useChatMessages,
  useChatStatus,
} from "@ai-sdk-tools/store";
import { DefaultChatTransport } from "ai";
import { FormEvent, useEffect, useRef } from "react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputMessage,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/mynth-ui/ai/prompt-input";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { ButtonGroup } from "@/components/mynth-ui/base/button-group";
import { Button } from "@/components/mynth-ui/base/button";
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
import { useTokensBalanceMutation } from "@/app/_queries/use-tokens-balance.query";

type ChatProps = {
  chat: { id: string; mode: ChatMode };
  initialMessages: PersonaUIMessage[];
};

export default function Chat(props: ChatProps) {
  const { addMessageToBranch, setActiveId } = useChatBranchesContext();
  const mutateBalance = useTokensBalanceMutation();
  // Use non-null assertion for ref type to satisfy downstream component prop types
  const messagesContainerRef = useRef<HTMLDivElement>(null!);
  const shouldScrollRef = useRef(false);

  useChat({
    id: props.chat.id,

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

      const cost = message.metadata?.cost ?? 0;
      if (cost) {
        mutateBalance((state) =>
          state
            ? {
                ...state,
                balance: state.balance - cost,
                totalBalance: state.balance - cost,
              }
            : undefined
        );
      }
    },

    generateId: () => `msg_${nanoid(32)}`,

    messages: props.initialMessages,
  });

  return (
    <div className="w-full flex flex-col justify-center items-center h-full mx-auto px-[12px] md:px-0 mt-auto">
      <ChatMessages
        initialMessages={props.initialMessages}
        containerRef={messagesContainerRef}
        shouldScrollRef={shouldScrollRef}
      />
      <ChatPrompt
        messagesContainerRef={messagesContainerRef}
        shouldScrollRef={shouldScrollRef}
      />
    </div>
  );
}

type ChatPromptProps = {
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  shouldScrollRef: React.MutableRefObject<boolean>;
};

function ChatPrompt(props: ChatPromptProps) {
  const { sendMessage, regenerate } = useChatActions();
  const status = useChatStatus();
  const messages = useChatMessages();

  const { openSettings } = useSettingsNavigation();

  // Scroll to position last user message at top of viewport when new message is sent
  useEffect(() => {
    if (props.shouldScrollRef.current && props.messagesContainerRef.current) {
      props.shouldScrollRef.current = false;

      // Wait for the next animation frame to ensure DOM is updated
      const rafId = requestAnimationFrame(() => {
        const container = props.messagesContainerRef.current;
        if (!container) return;

        // Find the last user message by iterating from the end of direct children
        const messageElements = Array.from(container.children);
        let lastUserMessageElement: Element | null = null;
        for (let i = messageElements.length - 1; i >= 0; i--) {
          const element = messageElements[i];
          if (element.classList.contains("is-user")) {
            lastUserMessageElement = element;
            break;
          }
        }

        if (lastUserMessageElement) {
          // Use scrollIntoView with scroll-margin-top handled via CSS on user messages
          lastUserMessageElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [messages.length, props.messagesContainerRef, props.shouldScrollRef]);

  const handleSubmit = async (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>
  ) => {
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
    const text = message.text?.trim();
    if (!text || text === "") return;

    // Set flag to trigger scroll after message is added
    props.shouldScrollRef.current = true;

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
    <PromptInput
      onSubmit={handleSubmit}
      className="sticky bottom-[12px] z-20 w-full max-w-[40rem] mx-auto mb-[12px]"
    >
      <PromptInputBody className="w-full max-w-full">
        <PromptInputTextarea
          disabled={status !== "ready"}
          placeholder="Write a message..."
          aria-label="Message Input"
          className="w-full"
        />
      </PromptInputBody>

      <PromptInputToolbar>
        <PromptInputTools>
          <ButtonGroup>
            <ChatModelSelector />
            <ButtonGroup.Separator />
            <Button
              size="icon"
              onClick={() => openSettings()}
              aria-label="Open settings"
            >
              <SlidersHorizontalIcon />
            </Button>
          </ButtonGroup>
        </PromptInputTools>

        <Button
          color="primary"
          size="icon"
          type="submit"
          aria-label="Send message"
          disabled={status === "streaming" || status === "submitted"}
        >
          {status === "error" ? (
            <ArrowsClockwiseIcon />
          ) : status === "streaming" || status === "submitted" ? (
            <CircleNotchIcon className="animate-spin" />
          ) : (
            <PaperPlaneTiltIcon />
          )}
        </Button>
      </PromptInputToolbar>
    </PromptInput>
  );
}

function ChatModelSelector() {
  const { navigateSettings } = useSettingsNavigation();
  const { modelId } = useChatMain();

  return (
    <Button
      size="sm"
      className="leading-none max-w-[180px] truncate"
      aria-label="Select AI model for role-play"
      onClick={() => navigateSettings("model")}
    >
      <span className="truncate">
        {textGenerationModels[modelId!]?.displayName}
      </span>
    </Button>
  );
}
