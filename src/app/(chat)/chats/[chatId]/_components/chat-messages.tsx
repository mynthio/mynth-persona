"use client";

import React, { useCallback, useRef, useState } from "react";
import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChatActions,
  useChatError,
  useChatMessages,
  useChatStatus,
  useChatStoreApi,
} from "@ai-sdk-tools/store";
import { Button } from "@/components/ui/button";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { ButtonGroup } from "@/components/ui/button-group";
import { Link } from "@/components/ui/link";
import { ApiChatMessagesResponse } from "@/app/(chat)/api/chats/[chatId]/messages/route";
import { useChatScroll, type ScrollActions } from "../_hooks/use-chat-scroll.hook";
import { ChatMessage } from "./chat-message";

function getErrorObject(error: string) {
  try {
    return JSON.parse(error);
  } catch {
    return { message: error };
  }
}

type ChatMessagesProps = {
  containerRef: React.RefObject<HTMLDivElement>;
  scrollActionsRef: React.MutableRefObject<ScrollActions>;
};

export default function ChatMessages(props: ChatMessagesProps) {
  const messages = useChatMessages<PersonaUIMessage>();
  const chatError = useChatError();
  const status = useChatStatus();
  const { setMessages, regenerate } = useChatActions<PersonaUIMessage>();
  const storeApi = useChatStoreApi<PersonaUIMessage>();

  const { chatId, modelId, authorNote } = useChatMain();
  const { scrollRestoreRef } = useChatBranchesContext();

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const firstMessageId = messages[0]?.id;

  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = props.containerRef || internalContainerRef;

  // Use a ref for isLoadingMore to avoid stale closure in observer callback and loadMore
  const isLoadingMoreRef = useRef(isLoadingMore);
  isLoadingMoreRef.current = isLoadingMore;

  const isStreaming = status === "streaming" || status === "submitted";
  const dynamicPaddingBottom = isStreaming
    ? "clamp(160px, 24vh, 360px)"
    : "128px";

  // Refs for prepend scroll correction — shared with useChatScroll via loadMore closure
  const previousHeightRef = useRef(0);
  const previousScrollYRef = useRef(0);
  const justPrependedRef = useRef(false);

  const loadMore = useCallback(async () => {
    const currentMessages = storeApi.getState().messages;
    const firstMessage = currentMessages[0];

    if (
      isLoadingMoreRef.current ||
      !firstMessage ||
      !firstMessage.metadata?.parentId
    )
      return;

    previousHeightRef.current = containerRef.current?.scrollHeight ?? 0;
    previousScrollYRef.current = window.pageYOffset;

    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/chats/${chatId}/messages?message_id=${firstMessage.id}&strict=true`,
      );
      const json: ApiChatMessagesResponse = await response.json();
      console.log("Infinite response length", json.messages.length);

      const newMessages = json.messages.slice(0, -1);
      setMessages([...newMessages, ...storeApi.getState().messages]);

      justPrependedRef.current = true;
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [storeApi, setMessages, chatId, containerRef]);

  const { sentinelRef, scrollToLatestMessage } = useChatScroll({
    containerRef,
    isStreaming,
    firstMessageId,
    scrollRestoreRef,
    loadMore,
    hasMoreMessages: !!messages[0]?.metadata?.parentId,
    previousHeightRef,
    previousScrollYRef,
    justPrependedRef,
  });

  // Expose scroll actions to parent (chat.tsx) via ref
  props.scrollActionsRef.current = { scrollToLatestMessage };

  if (messages.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="w-full h-full max-w-3xl mx-auto transition-[padding] duration-300 relative z-0"
      style={{ paddingBottom: dynamicPaddingBottom }}
    >
      {isLoadingMore && (
        <div className="text-center py-4">Loading older messages...</div>
      )}
      {messages[0]?.metadata?.parentId ? (
        <div ref={sentinelRef} style={{ height: "1px" }} />
      ) : null}
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {chatError && (
        <div className="px-[12px] py-[24px]">
          <p className="font-onest text-[1.1rem] text-surface-foreground/70">
            {chatError.message === "INSUFFICIENT_TOKENS" ? (
              <>
                <b>Action not available on current plan.</b> Try a different
                model or upgrade your plan{" "}
                <Link href="/plans" className="underline">
                  here
                </Link>
                .
              </>
            ) : getErrorObject(chatError.message).error ===
              "premium_model_not_available" ? (
              <>
                Premium models are not avilable on your plan. Upgrade your plan{" "}
                <Link href="/plans" className="underline">
                  here
                </Link>
                . Or switch to a non-premium model.
              </>
            ) : getErrorObject(chatError.message).error ===
              "rate_limit_exceeded" ? (
              <>
                You have reached the rate limit. Try again later. Or upgrade
                your plan{" "}
                <Link href="/plans" className="underline">
                  here
                </Link>
                .
              </>
            ) : (
              <>There was an error while generating the response. </>
            )}
          </p>

          <ButtonGroup className="mt-[12px]">
            <Button
              variant="outline"
              onClick={() =>
                regenerate({
                  body: {
                    event: "regenerate",
                    modelId,
                    authorNote,
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
