"use client";

import React, { useCallback } from "react";

import { useEffect, useRef, useState } from "react";
import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChatActions,
  useChatError,
  useChatMessages,
  useChatStatus,
} from "@ai-sdk-tools/store";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/mynth-ui/ai/message";
import { Button } from "@/components/mynth-ui/base/button";
import {
  ArrowsCounterClockwiseIcon,
  BrainIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CircleNotchIcon,
  CopyIcon,
  PencilSimpleIcon,
  SpinnerIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";
import { ButtonGroup } from "@/components/mynth-ui/base/button-group";
import { Response } from "@/components/mynth-ui/ai/response";
import { TextareaAutosize } from "@/components/mynth-ui/base/textarea";
import { nanoid } from "nanoid";
import { useUser } from "@clerk/nextjs";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { cn, getImageUrl } from "@/lib/utils";
import { ApiChatMessagesResponse } from "@/app/(chat)/api/chats/[chatId]/messages/route";
import { Link } from "@/components/ui/link";
import { Label } from "@/components/mynth-ui/base/label";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuPositioner,
  MenuTrigger,
} from "@/components/mynth-ui/base/menu";
import { useCopyToClipboard } from "@uidotdev/usehooks";

type ChatMessagesProps = {
  initialMessages: PersonaUIMessage[];
};

export default function ChatMessages(props: ChatMessagesProps) {
  /**
   * States & Data
   */
  const messages = useChatMessages<PersonaUIMessage>();
  const chatError = useChatError();
  const { setMessages, regenerate } = useChatActions();

  const { chatId } = useChatMain();

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef(0);
  const previousScrollYRef = useRef(0);

  const [justPrepended, setJustPrepended] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  // Use initialMessages until the client store has loaded actual messages
  const displayMessages =
    messages.length > 0 ? messages : props.initialMessages;

  const loadMore = useCallback(async () => {
    const firstMessage = messages[0];

    if (isLoadingMore || !firstMessage || !firstMessage.metadata?.parentId)
      return;

    previousHeightRef.current = containerRef.current?.scrollHeight ?? 0;
    previousScrollYRef.current = window.pageYOffset;

    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/chats/${chatId}/messages?message_id=${firstMessage.id}&strict=true`
      );
      const json: ApiChatMessagesResponse = await response.json();
      console.log("Infinite response length", json.messages.length);

      const newMessages = json.messages.slice(0, -1);
      setMessages((state) => [...newMessages, ...state] as any[]);

      setJustPrepended(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [setMessages, isLoadingMore, setIsLoadingMore, messages, chatId]);

  // Scroll to bottom on initial load (instant)
  useEffect(() => {
    // Ensure we scroll after first paint
    window.requestAnimationFrame(() => {
      const scrollY = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0
      );
      try {
        window.scrollTo({ top: scrollY, behavior: "auto" });
      } catch (e) {
        // fallback in environments without smooth/auto support
        window.scrollTo(0, scrollY);
      }
      setInitialScrollDone(true);
    });
  }, []);

  useEffect(() => {
    if (!initialScrollDone) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "400px 0px 0px 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [initialScrollDone, loadMore, isLoadingMore, setIsLoadingMore]);

  useEffect(() => {
    if (justPrepended) {
      const addedHeight =
        (containerRef.current?.scrollHeight ?? 0) - previousHeightRef.current;
      window.scrollTo(0, previousScrollYRef.current + addedHeight);
      setJustPrepended(false);
    }
  }, [justPrepended]);

  if (displayMessages.length === 0) return null;

  return (
    <div ref={containerRef} className="w-full h-full max-w-[42rem] mx-auto">
      {isLoadingMore && (
        <div className="text-center py-4">Loading older messages...</div>
      )}
      {displayMessages[0]?.metadata?.parentId ? (
        <div ref={sentinelRef} style={{ height: "1px" }} />
      ) : null}
      {displayMessages.map((message, messageIndex) => (
        <ChatMessage key={message.id} message={message} index={messageIndex} />
      ))}

      {chatError && (
        <div className="px-[12px] py-[24px]">
          <p className="font-onest text-[1.1rem] text-surface-foreground/70">
            {chatError.message === "INSUFFICIENT_TOKENS" ? (
              <>
                <b>Insufficient sparks.</b> Try other model or buy more sparks{" "}
                <Link href="/sparks" className="underline">
                  here
                </Link>
                .
              </>
            ) : (
              <>There was an error while generating the response.</>
            )}
          </p>

          <ButtonGroup className="mt-[12px]">
            <Button
              variant="outline"
              onClick={() =>
                regenerate({
                  body: {
                    event: "regenerate",
                  },
                })
              }
            >
              Retry
            </Button>
          </ButtonGroup>
        </div>
      )}
    </div>
  );
}

type ChatMessageProps = {
  index: number;
  message: PersonaUIMessage;
};

function ChatMessage(props: ChatMessageProps) {
  const { user } = useUser();
  const { personas } = useChatPersonas();
  const { editMessageId } = useChatMain();

  const avatarUrl = React.useMemo(() => {
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
            props.message.parts?.map((part, partIndex) => (
              <ChatMessagePart
                key={partIndex}
                messageId={props.message.id}
                part={part}
              />
            ))
          )}
        </MessageContent>

        <Menu modal={false}>
          <MenuTrigger>
            <MessageAvatar src={avatarUrl ?? undefined} fallback={" "} />
          </MenuTrigger>

          <MenuPositioner
            side={"top"}
            align={props.message.role === "assistant" ? "start" : "end"}
          >
            <MenuPopup>
              {props.message.role === "user" ? (
                <UserMessageMenuContent message={props.message} />
              ) : (
                <AssistantMessageMenuContent message={props.message} />
              )}
            </MenuPopup>
          </MenuPositioner>
        </Menu>
      </div>

      <ChatMessageActions message={props.message} />
    </Message>
  );
}

type ChatMessageMenuContentProps = {
  message: PersonaUIMessage;
};

function UserMessageMenuContent(props: ChatMessageMenuContentProps) {
  const [copiedText, copyToClipboard] = useCopyToClipboard();
  const { setEditMessageId } = useChatMain();

  const handleCopy = useCallback(() => {
    copyToClipboard(
      props.message.parts
        ?.map((p) => (p.type === "text" ? p.text : ""))
        .join("")
    );
  }, [copyToClipboard, props.message.parts]);

  return (
    <>
      <MenuItem onClick={handleCopy} icon={<CopyIcon />}>
        Copy message
      </MenuItem>
      <MenuItem
        onClick={() => setEditMessageId(props.message.id)}
        icon={<PencilSimpleIcon />}
      >
        Edit message
      </MenuItem>
    </>
  );
}

function AssistantMessageMenuContent(props: ChatMessageMenuContentProps) {
  const [copiedText, copyToClipboard] = useCopyToClipboard();

  const handleCopy = useCallback(() => {
    copyToClipboard(
      props.message.parts
        ?.map((p) => (p.type === "text" ? p.text : ""))
        .join("")
    );
  }, [copyToClipboard, props.message.parts]);

  return (
    <>
      <MenuItem onClick={handleCopy} icon={<CopyIcon />}>
        Copy message
      </MenuItem>
    </>
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

  const handleSubmit = React.useCallback(
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

        <ButtonGroup className="justify-end mt-[12px]">
          <Button
            onClick={() => {
              setEditMessageId(null);
            }}
            size="sm"
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" color="primary">
            Save
          </Button>
        </ButtonGroup>
      </form>
    </div>
  );
}

type ChatMessagePartProps = {
  messageId: string;
  part: PersonaUIMessage["parts"][0];
};

function ChatMessagePart(props: ChatMessagePartProps) {
  switch (props.part.type) {
    case "text":
      return (
        <Response
          className="prose text-surface-foreground
              [&_em]:font-onest [&_em]:text-purple-900 [&_em]:bg-purple-100/50 [&_em]:rounded-[8px]
              [&_span.md-doublequoted]:font-[500] [&_span.md-doublequoted]:text-black [&_span.md-doublequoted]:font-onest
            "
        >
          {props.part.text}
        </Response>
      );
    case "reasoning":
      return <ReasoningIndicator messageId={props.messageId} />;
  }

  return null;
}

function ReasoningIndicator(props: { messageId: string }) {
  const messages = useChatMessages();
  const status = useChatStatus();

  const isActive =
    status === "streaming" && messages.at(-1)?.id === props.messageId;

  if (!isActive) return null;

  return (
    <div
      className={cn("size-[36px] flex items-center justify-center", {
        "animate-pulse": isActive,
      })}
    >
      <BrainIcon />
    </div>
  );
}

/**
 * Custom hook to efficiently determine if a message is the last one during streaming
 */
function useIsLastMessageStreaming(messageId: string) {
  const messages = useChatMessages<PersonaUIMessage>();
  const status = useChatStatus();

  return React.useMemo(() => {
    const isLastMessage =
      messages.length > 0 && messages[messages.length - 1]?.id === messageId;
    const isStreaming = status === "streaming";
    return isLastMessage && isStreaming;
  }, [messages, messageId, status]);
}

type ChatMessageActions = {
  message: PersonaUIMessage;
};

function ChatMessageActions(props: ChatMessageActions) {
  const { message } = props;

  const { editMessageId } = useChatMain();

  // Boolean constant for UI changes - determines when to show loading indicator instead of branches
  const shouldShowLoadingIndicator = useIsLastMessageStreaming(message.id);

  if (editMessageId === message.id) return null;

  return (
    <ButtonGroup
      spacing="compact"
      className="group-[.is-assistant]:self-start pointer-fine:opacity-20 pointer-fine:hover:opacity-100 transition-opacity duration-250"
    >
      {message.role === "assistant" && (
        <>
          <ChatMessageRegenerate messageId={message.id} />
          <ButtonGroup.Separator />
        </>
      )}
      {shouldShowLoadingIndicator ? (
        // You can replace this with your custom loading UI component
        <Label variant="ghost">
          <CircleNotchIcon className="animate-spin" />
        </Label>
      ) : (
        <ChatMessageBranches
          messageId={message.id}
          parentId={message.metadata?.parentId}
        />
      )}

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
      <span className="text-[0.75rem] cursor-default pointer-events-none select-none">
        {currentMessageIndex + 1} / {branchSize}
      </span>
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
