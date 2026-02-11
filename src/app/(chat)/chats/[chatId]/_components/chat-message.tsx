"use client";

import React, { useEffect, useMemo } from "react";
import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { useChatStore } from "@ai-sdk-tools/store";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { useUser } from "@clerk/nextjs";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { getImageUrl } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ShimmerText from "@/components/kokonutui/shimmer-text";
import { useChatMain } from "../_contexts/chat-main.context";
import { useChatImageGenerationStore } from "@/stores/chat-image-generation.store";
import { ChatMessageImages } from "./chat-message-images";
import { ChatMessageImageInProgress } from "./chat-message-image-in-progress";
import { DevCheckpointViewer } from "./dev-checkpoint-viewer";
import { EditMessage } from "./edit-message";
import {
  UserMessageMenuContent,
  AssistantMessageMenuContent,
} from "./chat-message-menus";
import { ChatMessageActions } from "./chat-message-actions";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreIcon, Loading02Icon } from "@hugeicons/core-free-icons";

type ChatMessageProps = {
  message: PersonaUIMessage;
};

export const ChatMessage = React.memo(function ChatMessage(
  props: ChatMessageProps,
) {
  const { user } = useUser();
  const { personas } = useChatPersonas();
  const { editMessageId } = useChatMain();
  const imageGenerationRuns = useChatImageGenerationStore(
    (state) => state.imageGenerationRuns,
  );
  const removeImageGenerationRun = useChatImageGenerationStore(
    (state) => state.removeImageGenerationRun,
  );

  // Check if this message is currently streaming
  const isStreaming = useChatStore((state) => {
    const messages = state.messages;
    const isLastMessage =
      messages.length > 0 && messages[messages.length - 1]?.id === props.message.id;
    return isLastMessage && state.status === "streaming";
  });

  const avatarUrl = React.useMemo(() => {
    if (props.message.role === "user") {
      return user?.imageUrl;
    } else if (props.message.role === "assistant") {
      if (personas[0]?.profileImageIdMedia) {
        return getImageUrl(personas[0].profileImageIdMedia, "thumb");
      }
    }
    return null;
  }, [user, props.message.role, personas]);

  // Get in-progress image generation runs for this message
  const inProgressRuns = useMemo(() => {
    return Object.values(imageGenerationRuns).filter(
      (r) => r.messageId === props.message.id,
    );
  }, [imageGenerationRuns, props.message.id]);

  const messageMediaIds = useMemo(() => {
    const media = props.message.metadata?.media;
    if (!media || media.length === 0) {
      return null;
    }

    return new Set(media.map((item) => item.id));
  }, [props.message.metadata?.media]);

  useEffect(() => {
    if (!messageMediaIds) return;

    inProgressRuns.forEach((run) => {
      // Check multi-image format first
      if (run.output?.images && run.output.images.length > 0) {
        const anyMediaIdInMessage = run.output.images.some((img) =>
          messageMediaIds.has(img.mediaId),
        );
        if (anyMediaIdInMessage) {
          removeImageGenerationRun(run.runId);
        }
        return;
      }

      // Fallback to legacy single-image format
      const mediaId = run.output?.mediaId;
      if (mediaId && messageMediaIds.has(mediaId)) {
        removeImageGenerationRun(run.runId);
      }
    });
  }, [inProgressRuns, messageMediaIds, removeImageGenerationRun]);

  return (
    <Message
      from={props.message.role}
      data-message-id={props.message.id}
      className={`py-6 flex-col gap-[12px] ${
        props.message.role === "user" ? "scroll-mt-[80px]" : ""
      }`}
    >
      <div className="w-full flex items-end justify-end group-[.is-assistant]:flex-row-reverse gap-[4px]">
        <MessageContent className="group-[.is-user]:rounded-3xl group-[.is-user]:rounded-br-sm group-[.is-user]:px-6 group-[.is-user]:border group-[.is-user]:border-primary-foreground/15">
          {editMessageId === props.message.id &&
          (props.message.role === "user" ||
            props.message.role === "assistant") ? (
            <EditMessage
              messageId={props.message.id}
              parentId={props.message.metadata?.parentId ?? null}
              parts={props.message.parts}
              role={props.message.role}
            />
          ) : (
            <>
              {props.message.parts?.map((part, partIndex) => (
                <ChatMessagePart
                  key={`${props.message.id}-${partIndex}`}
                  messageId={props.message.id}
                  part={part}
                />
              ))}

              <ChatMessageImages
                media={props.message.metadata?.media}
                inProgressRuns={inProgressRuns}
              />

              {props.message.metadata?.checkpoint && (
                <DevCheckpointViewer
                  checkpoint={props.message.metadata.checkpoint}
                />
              )}

              {inProgressRuns.length > 0
                ? inProgressRuns.map((run) => (
                    <ChatMessageImageInProgress key={run.runId} run={run} />
                  ))
                : null}
            </>
          )}
        </MessageContent>
      </div>

      {/* Avatar pill + action buttons, same row below message */}
      <div className="flex items-center gap-3 group-[.is-user]:justify-end mt-1">
        {props.message.role === "user" ? (
          <>
            <ChatMessageActions message={props.message} isStreaming={isStreaming} />
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild disabled={isStreaming}>
                <button
                  type="button"
                  disabled={isStreaming}
                  className="flex items-center gap-2.5 rounded-full border border-border bg-gradient-to-l from-primary/15 via-primary/5 to-background pl-4 pr-2 py-1 hover:border-border hover:from-primary/20 hover:via-primary/10 hover:to-muted/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStreaming ? (
                    <HugeiconsIcon
                      icon={Loading02Icon}
                      size={14}
                      className="text-muted-foreground animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={MoreIcon}
                      size={14}
                      className="text-muted-foreground"
                    />
                  )}
                  <Avatar data-size="sm">
                    <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" align="end" className="w-48">
                <UserMessageMenuContent message={props.message} />
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild disabled={isStreaming}>
                <button
                  type="button"
                  disabled={isStreaming}
                  className="flex items-center gap-2.5 rounded-full border border-border bg-gradient-to-r from-primary/15 via-primary/5 to-background pl-2 pr-4 py-1 hover:border-border hover:from-primary/20 hover:via-primary/10 hover:to-muted/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Avatar data-size="sm">
                    <AvatarImage src={avatarUrl ?? undefined} />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  {isStreaming ? (
                    <HugeiconsIcon
                      icon={Loading02Icon}
                      size={14}
                      className="text-muted-foreground animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={MoreIcon}
                      size={14}
                      className="text-muted-foreground"
                    />
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" align="start" className="w-48">
                <AssistantMessageMenuContent message={props.message} />
              </DropdownMenuContent>
            </DropdownMenu>

            <ChatMessageActions message={props.message} isStreaming={isStreaming} />
          </>
        )}
      </div>
    </Message>
  );
});

type ChatMessagePartProps = {
  messageId: string;
  part: PersonaUIMessage["parts"][0];
};

function ChatMessagePart(props: ChatMessagePartProps) {
  switch (props.part.type) {
    case "text":
      return (
        <Response className="prose dark:prose-invert prose-lg dark:[&_em]:text-violet-300 [&_em]:text-violet-700">
          {props.part.text}
        </Response>
      );
    case "reasoning":
      return <ReasoningIndicator messageId={props.messageId} />;
  }

  return null;
}

function ReasoningIndicator(props: { messageId: string }) {
  // Use store selector for efficient single-subscription check
  const isActive = useChatStore((state) => {
    const lastMessage = state.messages.at(-1);
    return (
      (state.status === "streaming" || state.status === "submitted") &&
      lastMessage?.id === props.messageId
    );
  });

  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center ml-2 h-8">
      <ShimmerText text="Thinking..." />
    </div>
  );
}
