"use client";

import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/mynth-ui/ai/message";
import { Response } from "@/components/mynth-ui/ai/response";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChat,
  useChatActions,
  useChatMessages,
  useChatStatus,
} from "@ai-sdk-tools/store";
import { useUser } from "@clerk/nextjs";
import { DefaultChatTransport } from "ai";
import { FormEvent, useCallback, useMemo } from "react";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { getImageUrl } from "@/lib/utils";
import {
  PromptInput,
  PromptInputBody,
  PromptInputMessage,
  PromptInputTextarea,
} from "@/components/mynth-ui/ai/prompt-input";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";
import { ButtonGroup } from "@/components/mynth-ui/base/button-group";
import { Button } from "@/components/mynth-ui/base/button";
import {
  ArrowsCounterClockwiseIcon,
  BrainIcon,
  CaretLeftIcon,
  CaretRightIcon,
  PencilSimpleIcon,
  SlidersHorizontalIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ChatMode } from "@/schemas/backend/chats/chat.schema";
import { nanoid } from "nanoid";
import VirtualChatMessages from "./virtual-chat-messages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectTrigger,
} from "@/components/mynth-ui/base/select";
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";
import { useChatMain } from "../_contexts/chat-main.context";
import { TextareaAutosize } from "@/components/ui/textarea";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";

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
    <div className="pb-[6px] w-full px-[12px] md:px-0">
      <ChatMessages initialMessages={props.initialMessages} />
      <ChatPrompt />
    </div>
  );
}

function ChatMessages({
  initialMessages,
}: {
  initialMessages: PersonaUIMessage[];
}) {
  const messages = useChatMessages<PersonaUIMessage>();

  return (
    <VirtualChatMessages
      messages={messages.length > 0 ? messages : initialMessages}
      useWindowScroller
      // Keep API minimal for the main Chat component
      renderMessage={(message) => <ChatMessage message={message} />}
      className="w-full"
      bottomPadding={250}
      autoScrollToBottom
      overscan={8}
      estimateSize={() => 140}
    />
  );
}

type ChatMessageProps = {
  message: PersonaUIMessage;
};

function ChatMessage(props: ChatMessageProps) {
  const { user } = useUser();
  const { personas } = useChatPersonas();
  const { editMessageId } = useChatMain();

  const avatarUrl = useMemo(() => {
    if (props.message.role === "user") {
      return user?.imageUrl;
    } else if (props.message.role === "assistant") {
      if (personas[0]?.profileImageId) {
        return getImageUrl(personas[0].profileImageId, "thumb");
      }
    }
    return null;
  }, [user, props.message.role, personas]);

  return (
    <Message
      from={props.message.role}
      className="py-[1.5rem] flex-col gap-[12px]"
    >
      <div className="w-full flex items-end justify-end group-[.is-assistant]:flex-row-reverse gap-[4px]">
        <MessageContent>
          {editMessageId === props.message.id &&
          props.message.role === "user" ? (
            <EditMessage
              messageId={props.message.id}
              parentId={props.message.metadata?.parentId ?? null}
              parts={props.message.parts}
            />
          ) : (
            props.message.parts.map((part, partIndex) => (
              <ChatMessagePart key={partIndex} part={part} />
            ))
          )}
        </MessageContent>
        {avatarUrl && (
          <MessageAvatar src={avatarUrl} fallback={user?.username ?? "??"} />
        )}
      </div>

      <ChatMessageActions message={props.message} />
    </Message>
  );
}

type EditMessageProps = {
  messageId: string;
  parentId: string | null;
  parts: PersonaUIMessage["parts"];
};

function EditMessage(props: EditMessageProps) {
  const { setEditMessageId } = useChatMain();
  const { regenerate, setMessages } = useChatActions();
  const { addMessageToBranch } = useChatBranchesContext();

  const initialMessage = props.parts.find((p) => p.type === "text")?.text ?? "";

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const message = formData.get("message");

      if (typeof message !== "string") return;

      const editedMessage = {
        id: `msg_${nanoid(32)}`,
        role: "user",
        parts: [{ type: "text", text: message }],
        metadata: {
          parentId: props.parentId,
        },
      } as PersonaUIMessage;

      setMessages((state) =>
        state.map((stateMessage) =>
          stateMessage.id === props.messageId
            ? {
                ...stateMessage,
                ...editedMessage,
              }
            : stateMessage
        )
      );

      regenerate({
        messageId: editedMessage.id,
        body: {
          event: "edit_message",

          editedMessage,
        },
      });

      addMessageToBranch(props.parentId, {
        id: props.messageId,
        createdAt: new Date(Date.now() - 1000),
      });

      addMessageToBranch(props.parentId, {
        id: editedMessage.id,
        createdAt: new Date(),
      });

      setEditMessageId(null);
    },
    [regenerate, props.messageId]
  );

  return (
    <div className="flex flex-col gap-[12px]">
      <form onSubmit={handleSubmit}>
        <TextareaAutosize
          name="message"
          placeholder="Enter edited message..."
          className="font-sans bg-none focus-visible:outline-none focus-visible:border-none focus-visible:ring-0 outline-none border-none shadow-none focus:outline-none focus:ring-0 focus:border-none min-h-0"
          minRows={1}
          defaultValue={initialMessage}
        />

        <ButtonGroup className="justify-end">
          <Button
            onClick={() => {
              setEditMessageId(null);
            }}
            size="sm"
          >
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save
          </Button>
        </ButtonGroup>
      </form>
    </div>
  );
}

type ChatMessagePartProps = {
  part: PersonaUIMessage["parts"][0];
};

function ChatMessagePart(props: ChatMessagePartProps) {
  const { part } = props;

  if (part.type === "text") {
    return (
      <Response className="prose [&_em]:font-onest [&_em]:text-surface-foreground/80">
        {part.text}
      </Response>
    );
  }

  return null;
}

type ChatMessageActions = {
  message: PersonaUIMessage;
};

function ChatMessageActions(props: ChatMessageActions) {
  const { message } = props;

  const { editMessageId } = useChatMain();

  if (editMessageId === message.id) return null;

  return (
    <ButtonGroup
      spacing="compact"
      className="group-[.is-assistant]:self-start opacity-20 hover:opacity-100 transition-opacity duration-250"
    >
      {message.role === "assistant" && (
        <>
          <ChatMessageRegenerate messageId={message.id} />
          <ButtonGroup.Separator />
        </>
      )}
      <ChatMessageBranches
        messageId={message.id}
        parentId={message.metadata?.parentId}
      />

      {message.role === "user" && (
        <>
          <ButtonGroup.Separator />
          <ChatMessageEditButton messageId={message.id} />
        </>
      )}
    </ButtonGroup>
  );
}

type ChatMessageEditButtonProps = {
  messageId: string;
};

function ChatMessageEditButton(props: ChatMessageEditButtonProps) {
  const { editMessageId, setEditMessageId } = useChatMain();

  return (
    <Button
      size="icon-sm"
      disabled={editMessageId === props.messageId}
      onClick={() => {
        setEditMessageId(props.messageId);
      }}
    >
      <PencilSimpleIcon />
    </Button>
  );
}

type ChatMessageRegenerateProps = {
  messageId: string;
};

function ChatMessageRegenerate(props: ChatMessageRegenerateProps) {
  const { messageId } = props;

  const { regenerate } = useChatActions();
  const status = useChatStatus();

  return (
    <Button
      size="icon-sm"
      onClick={() => {
        regenerate({
          messageId,
          body: {
            event: "regenerate",
          },
        });
      }}
      disabled={status === "submitted" || status === "streaming"}
    >
      <ArrowsCounterClockwiseIcon />
    </Button>
  );
}

type ChatMessageBranchesProps = {
  messageId: string;
  parentId?: string | null;
};

function ChatMessageBranches(props: ChatMessageBranchesProps) {
  const { branches, branchId, setActiveId } = useChatBranchesContext();
  const { chatId } = useChatMain();
  const { setMessages } = useChatActions();

  const branch = branches[props.parentId || ROOT_BRANCH_PARENT_ID] ?? [];

  const idx = branch.findIndex(
    (branchMessage) => branchMessage.id === props.messageId
  );

  const currentMessageIndex = idx > -1 ? idx : 0;

  const branchSize = branch.length > 0 ? branch.length : 1;

  const handleBranchChange = async (newBranchId: string) => {
    if (newBranchId === branchId) return;

    const newBranchMessages = await fetch(
      `/api/chats/${chatId}/messages?messageId=${newBranchId}`
    ).then((res) => res.json());

    setActiveId(newBranchMessages.leafId);
    setMessages(newBranchMessages.messages);
  };

  return (
    <>
      <Button
        size="icon-sm"
        disabled={currentMessageIndex === 0}
        onClick={() => {
          if (currentMessageIndex > 0) {
            handleBranchChange(branch[currentMessageIndex - 1].id);
          }
        }}
      >
        <CaretLeftIcon />
      </Button>
      <Button size="sm">
        {currentMessageIndex + 1} / {branchSize}
      </Button>
      <Button
        size="icon-sm"
        disabled={currentMessageIndex === branchSize - 1}
        onClick={() => {
          if (currentMessageIndex < branchSize - 1) {
            handleBranchChange(branch[currentMessageIndex + 1].id);
          }
        }}
      >
        <CaretRightIcon />
      </Button>
    </>
  );
}

function ChatPrompt() {
  const { sendMessage } = useChatActions();
  const messages = useChatMessages();
  const { modelId, setModelId } = useChatMain();
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
    <PromptInput onSubmit={handleSubmit} className="sticky md:bottom-[12px]">
      <PromptInputBody>
        <PromptInputTextarea placeholder="Write a message..." />
      </PromptInputBody>
      <ButtonGroup className="p-[20px]">
        <Select modal={false}>
          <SelectTrigger
            nativeButton
            render={<Button className="leading-none" />}
          >
            <BrainIcon />
            {textGenerationModels[modelId!]?.displayName}
          </SelectTrigger>

          <SelectPositioner>
            <SelectContent>
              {Object.values(textGenerationModels).map((model) => (
                <SelectItem key={model.modelId} value={model.modelId}>
                  {model.modelId}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectPositioner>
        </Select>

        <ButtonGroup.Separator />

        <Button size="icon" onClick={() => openSettings()}>
          <SlidersHorizontalIcon />
        </Button>
      </ButtonGroup>
    </PromptInput>
  );
}
