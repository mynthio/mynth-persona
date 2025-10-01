"use client";

import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { useChat, useChatActions, useChatMessages } from "@ai-sdk-tools/store";
import { DefaultChatTransport } from "ai";
import { FormEvent, useState } from "react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputMessage,
  PromptInputTextarea,
} from "@/components/mynth-ui/ai/prompt-input";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { ButtonGroup } from "@/components/mynth-ui/base/button-group";
import { Button } from "@/components/mynth-ui/base/button";
import {
  BrainIcon,
  PaperPlaneTiltIcon,
  SlidersHorizontalIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ChatMode } from "@/schemas/backend/chats/chat.schema";
import { nanoid } from "nanoid";
import ChatMessages from "./chat-messages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectTrigger,
} from "@/components/mynth-ui/base/select";
import {
  TextGenerationModelId,
  textGenerationModels,
} from "@/config/shared/models/text-generation-models.config";
import { useChatMain } from "../_contexts/chat-main.context";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";
import { updateChatAction } from "@/actions/update-chat.action";
import { useToast } from "@/components/ui/toast";
import { chatConfig } from "@/config/shared/chat/chat-models.config";

type ChatProps = {
  chat: { id: string; mode: ChatMode };
  initialMessages: PersonaUIMessage[];
};

export default function Chat(props: ChatProps) {
  const { addMessageToBranch, setActiveId } = useChatBranchesContext();

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
  const { sendMessage } = useChatActions();
  const messages = useChatMessages();

  const { openSettings } = useSettingsNavigation();

  const handleSubmit = async (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>
  ) => {
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
      className="sticky mb-[12px] shrink-0 bottom-[12px] w-full max-w-[40rem] mx-auto"
    >
      <PromptInputBody>
        <PromptInputTextarea placeholder="Write a message..." />
      </PromptInputBody>
      <ButtonGroup className="py-[12px] md:py-[20px] px-[20px] w-full">
        <ChatModelSelector />
        <ButtonGroup.Separator />

        <Button size="icon" onClick={() => openSettings()}>
          <SlidersHorizontalIcon />
        </Button>

        <Button type="submit" size="icon" color="primary" className="ml-auto">
          <PaperPlaneTiltIcon />
        </Button>
      </ButtonGroup>
    </PromptInput>
  );
}

function ChatModelSelector() {
  const { add } = useToast();
  const { chatId, modelId, setModelId } = useChatMain();
  const [isLoading, setIsLoading] = useState(false);

  const handleModelChange = async (modelId: TextGenerationModelId) => {
    if (isLoading) return;
    setIsLoading(true);

    await updateChatAction(chatId, {
      title: null,

      settings: {
        model: modelId,
      },
    })
      .then(() => {
        setModelId(modelId);
      })
      .catch(() => {
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
    <Select
      disabled={isLoading}
      modal={false}
      onValueChange={(val) => handleModelChange(val as TextGenerationModelId)}
      items={chatConfig.models.map((model) => ({
        key: model.modelId,
        label: model.displayName,
        value: model.modelId,
      }))}
    >
      <SelectTrigger
        nativeButton
        render={
          <Button size="sm" className="leading-none max-w-[180px] truncate" />
        }
      >
        {/* <BrainIcon className="shrink-0" /> */}
        <span className="truncate">
          {textGenerationModels[modelId!]?.displayName}
        </span>
      </SelectTrigger>

      <SelectPositioner>
        <SelectContent>
          {chatConfig.models.map((model) => (
            <SelectItem key={model.modelId} value={model.modelId}>
              {model.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectPositioner>
    </Select>
  );
}
