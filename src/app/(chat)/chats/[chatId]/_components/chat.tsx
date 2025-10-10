"use client";

import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChat,
  useChatActions,
  useChatMessages,
  useChatStatus,
} from "@ai-sdk-tools/store";
import { DefaultChatTransport } from "ai";
import { FormEvent } from "react";
import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
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
      <ChatMessages initialMessages={props.initialMessages} />
      <ChatPrompt />
    </div>
  );
}

function ChatPrompt() {
  const { sendMessage, regenerate } = useChatActions();
  const status = useChatStatus();
  const messages = useChatMessages();

  const { openSettings } = useSettingsNavigation();

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
      className="sitcky max-w-[680px] bottom-[16px] mb-[12px]"
    >
      <PromptInputBody>
        <PromptInputTextarea className="" />
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
          disabled={status === "ready" || status === "streaming"}
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

  return (
    <PromptInput
      onSubmit={handleSubmit}
      className="sticky mb-[12px] shrink-0 bottom-[12px] w-full max-w-[40rem] mx-auto"
    >
      <PromptInputBody className="w-full max-w-full">
        <PromptInputTextarea
          disabled={status !== "ready"}
          placeholder="Write a message..."
          aria-label="Message Input"
          className="w-full"
        />
      </PromptInputBody>
      <ButtonGroup className="py-[12px] md:py-[20px] px-[20px] w-full">
        <ChatModelSelector />
        <ButtonGroup.Separator />

        <Button
          size="icon"
          onClick={() => openSettings()}
          aria-label="Open settings"
        >
          <SlidersHorizontalIcon />
        </Button>

        <Button
          type="submit"
          size="icon"
          color="primary"
          aria-label="Send message"
          className="ml-auto"
          disabled={status === "streaming" || status === "submitted"}
        >
          {status === "error" ? (
            <ArrowsClockwiseIcon />
          ) : status !== "ready" ? (
            <CircleNotchIcon className="animate-spin" />
          ) : (
            <PaperPlaneTiltIcon />
          )}
        </Button>
      </ButtonGroup>
    </PromptInput>
  );
}

function ChatModelSelector() {
  const { navigateSettings } = useSettingsNavigation();
  const { chatId, modelId, setModelId } = useChatMain();

  // const handleModelChange = async (modelId: TextGenerationModelId) => {
  //   if (isLoading) return;
  //   setIsLoading(true);

  //   await updateChatAction(chatId, {
  //     settings: {
  //       model: modelId,
  //     },
  //   })
  //     .then(() => {
  //       setModelId(modelId);
  //     })
  //     .catch(() => {
  //       add({
  //         title: "Failed switch to model",
  //         description: "Try again or contact support",
  //       });
  //     })
  //     .finally(() => {
  //       setIsLoading(false);
  //     });
  // };

  return (
    <Button
      size="sm"
      className="leading-none max-w-[180px] truncate"
      aria-label="Select AI model for role-play"
      onClick={() => navigateSettings("model")}
    >
      {/* <BrainIcon className="shrink-0" /> */}
      <span className="truncate">
        {textGenerationModels[modelId!]?.displayName}
      </span>
    </Button>
  );
}
