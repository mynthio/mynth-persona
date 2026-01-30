"use client";

import React, {
  useCallback,
  useMemo,
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChatActions,
  useChatError,
  useChatMessages,
  useChatStatus,
  useChatStore,
  useChatStoreApi,
} from "@ai-sdk-tools/store";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import {
  BrainIcon,
  CopyIcon,
  PencilSimpleIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";
import { ButtonGroup } from "@/components/ui/button-group";
import { Response } from "@/components/ai-elements/response";
import { nanoid } from "nanoid";
import { useUser } from "@clerk/nextjs";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { getImageUrl } from "@/lib/utils";
import { ApiChatMessagesResponse } from "@/app/(chat)/api/chats/[chatId]/messages/route";
import { Link } from "@/components/ui/link";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteMessageAction } from "@/actions/delete-message.action";
import { Textarea } from "@/components/ui/textarea";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { ChatMessageImages } from "./chat-message-images";
import { ChatMessageImageInProgress } from "./chat-message-image-in-progress";
import { DevCheckpointViewer } from "./dev-checkpoint-viewer";
import { useChatImageGenerationStore } from "@/stores/chat-image-generation.store";
import {
  generateMessageImage,
  ImageGenerationMode,
} from "@/actions/generate-message-image";
import {
  IMAGE_MODELS,
  isModelBeta,
  isModelNew,
  ImageModelId,
  supportsReferenceImages,
} from "@/config/shared/image-models";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  Edit04,
  Image03,
  RefreshCcw05,
  Trash03,
} from "@untitledui/icons";
import ShimmerText from "@/components/kokonutui/shimmer-text";

function getErrorObject(error: string) {
  try {
    return JSON.parse(error);
  } catch {
    return { message: error };
  }
}

const CHARACTER_MODE_MODELS = Object.values(IMAGE_MODELS).filter((model) =>
  supportsReferenceImages(model.id),
);
const CREATIVE_MODE_MODELS = Object.values(IMAGE_MODELS);

type ChatMessagesProps = {
  containerRef: React.RefObject<HTMLDivElement>;
  shouldScrollRef: React.MutableRefObject<boolean>;
};

export default function ChatMessages(props: ChatMessagesProps) {
  /**
   * States & Data
   */
  const messages = useChatMessages<PersonaUIMessage>();
  const chatError = useChatError();
  const status = useChatStatus();
  const { setMessages, regenerate } = useChatActions<PersonaUIMessage>();
  const storeApi = useChatStoreApi<PersonaUIMessage>();

  const { chatId, modelId } = useChatMain();
  const { scrollRestoreRef } = useChatBranchesContext();

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef(0);
  const previousScrollYRef = useRef(0);

  const [justPrepended, setJustPrepended] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  // Auto-scroll tracking refs
  const previousMessageCountRef = useRef(messages.length);
  const userScrolledAwayRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const autoScrollRafRef = useRef<number | null>(null);

  // Use the passed ref or fallback to internal ref
  const containerRef = props.containerRef || internalContainerRef;

  // Add bottom padding when streaming to create space for assistant response
  const isStreaming = status === "streaming" || status === "submitted";
  // Provide baseline space for sticky prompt; expand slightly while streaming
  const dynamicPaddingBottom = isStreaming
    ? "clamp(160px, 24vh, 360px)"
    : "128px";

  const loadMore = useCallback(async () => {
    const currentMessages = storeApi.getState().messages;
    const firstMessage = currentMessages[0];

    if (isLoadingMore || !firstMessage || !firstMessage.metadata?.parentId)
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
      // Read latest messages after async operation to avoid stale closure
      setMessages([...newMessages, ...storeApi.getState().messages]);

      setJustPrepended(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [storeApi, setMessages, isLoadingMore, chatId, containerRef]);

  // Scroll to bottom on initial load (instant)
  useEffect(() => {
    // Ensure we scroll after first paint
    window.requestAnimationFrame(() => {
      const scrollY = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
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
      },
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
  }, [justPrepended, containerRef]);

  // Scroll restoration after branch switch
  // Uses useLayoutEffect to run before paint, ensuring no visual jump
  useLayoutEffect(() => {
    const restoreInfo = scrollRestoreRef.current;
    if (!restoreInfo) return;

    // Clear the ref immediately to prevent re-triggering
    scrollRestoreRef.current = null;

    const { parentId, offsetFromTop } = restoreInfo;

    if (parentId) {
      const parentElement = document.querySelector(
        `[data-message-id="${parentId}"]`
      );
      if (parentElement) {
        const rect = parentElement.getBoundingClientRect();
        const scrollDelta = rect.top - offsetFromTop;
        window.scrollBy({ top: scrollDelta, behavior: "smooth" });
      }
    }
  }, [messages, scrollRestoreRef]);

  // Detect user scrolling away during streaming to disable auto-scroll
  useEffect(() => {
    if (!isStreaming) {
      // Reset when not streaming
      userScrolledAwayRef.current = false;
      return;
    }

    const handleScroll = () => {
      const currentScrollTop = window.scrollY;
      const maxScrollTop =
        document.documentElement.scrollHeight - window.innerHeight;
      const distanceFromBottom = maxScrollTop - currentScrollTop;

      // If user scrolled up more than 150px from bottom, consider them "scrolled away"
      if (distanceFromBottom > 150) {
        // Check if this was an upward scroll (user action, not auto-scroll)
        if (currentScrollTop < lastScrollTopRef.current - 10) {
          userScrolledAwayRef.current = true;
        }
      } else {
        // User is near bottom, re-enable auto-scroll
        userScrolledAwayRef.current = false;
      }

      lastScrollTopRef.current = currentScrollTop;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isStreaming]);

  // Auto-scroll when new messages are added (user sends a message)
  useEffect(() => {
    if (!initialScrollDone) return;

    const currentCount = messages.length;
    const previousCount = previousMessageCountRef.current;
    previousMessageCountRef.current = currentCount;

    // Check if a new message was added (not prepended/loaded more)
    if (currentCount > previousCount && !justPrepended) {
      // If shouldScrollRef is set (user just sent a message), scroll to show it
      if (props.shouldScrollRef.current) {
        props.shouldScrollRef.current = false;
        userScrolledAwayRef.current = false;

        // Get the last user message (the one just sent)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage) {
          // Use requestAnimationFrame to ensure DOM has updated
          requestAnimationFrame(() => {
            const messageElement = document.querySelector(
              `[data-message-id="${lastMessage.id}"]`
            );
            if (messageElement) {
              // Scroll so the message is visible near the top third of the viewport
              const rect = messageElement.getBoundingClientRect();
              const targetOffset = window.innerHeight * 0.2; // 20% from top
              const scrollTo = window.scrollY + rect.top - targetOffset;

              window.scrollTo({
                top: Math.max(0, scrollTo),
                behavior: "smooth",
              });
            }
          });
        }
      }
    }
    // Note: We intentionally use messages.length instead of messages to avoid
    // re-running on every streaming update. We only need to scroll when a new
    // message is added, not when content changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, initialScrollDone, justPrepended, props.shouldScrollRef]);

  // Auto-scroll during streaming to keep new content visible
  useEffect(() => {
    if (!isStreaming) {
      // Cancel any pending animation frame when not streaming
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
      return;
    }

    // Continuously check and scroll to bottom during streaming
    const scrollToBottom = () => {
      // Always schedule next frame while streaming to keep loop running
      // (allows re-engaging scroll when user returns to bottom)
      autoScrollRafRef.current = requestAnimationFrame(scrollToBottom);

      // Skip actual scrolling if user has scrolled away
      if (userScrolledAwayRef.current) return;

      const maxScrollTop =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentScrollTop = window.scrollY;

      // Only scroll if we're not already at bottom
      if (maxScrollTop - currentScrollTop > 5) {
        window.scrollTo({
          top: maxScrollTop,
          behavior: "auto", // Use instant scroll during streaming for smooth experience
        });
      }
    };

    autoScrollRafRef.current = requestAnimationFrame(scrollToBottom);

    return () => {
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
    };
  }, [isStreaming]);

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
  message: PersonaUIMessage;
};

const ChatMessage = React.memo(function ChatMessage(props: ChatMessageProps) {
  const { user } = useUser();
  const { personas } = useChatPersonas();
  const { editMessageId } = useChatMain();
  const imageGenerationRuns = useChatImageGenerationStore(
    (state) => state.imageGenerationRuns,
  );
  const removeImageGenerationRun = useChatImageGenerationStore(
    (state) => state.removeImageGenerationRun,
  );

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
          props.message.role === "user" ? (
            <EditMessage
              messageId={props.message.id}
              parentId={props.message.metadata?.parentId ?? null}
              parts={props.message.parts}
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

              {inProgressRuns.length > 0 &&
                inProgressRuns.map((run) => (
                  <ChatMessageImageInProgress key={run.runId} run={run} />
                ))}
            </>
          )}
        </MessageContent>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Avatar>
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback>
                  {props.message.role === "user" ? "U" : "A"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={"top"}
            align={props.message.role === "assistant" ? "start" : "end"}
            className="w-48"
          >
            {props.message.role === "user" ? (
              <UserMessageMenuContent message={props.message} />
            ) : (
              <AssistantMessageMenuContent message={props.message} />
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChatMessageActions message={props.message} />
    </Message>
  );
});

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
        .join(""),
    );
  }, [copyToClipboard, props.message.parts]);

  return (
    <>
      <DropdownMenuItem onClick={handleCopy}>
        <CopyIcon className="mr-2" size={16} />
        Copy message
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setEditMessageId(props.message.id)}>
        <PencilSimpleIcon className="mr-2" size={16} />
        Edit message
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DeleteMessageMenuItem messageId={props.message.id} />
    </>
  );
}

function AssistantMessageMenuContent(props: ChatMessageMenuContentProps) {
  const [copiedText, copyToClipboard] = useCopyToClipboard();

  const handleCopy = useCallback(() => {
    copyToClipboard(
      props.message.parts
        ?.map((p) => (p.type === "text" ? p.text : ""))
        .join(""),
    );
  }, [copyToClipboard, props.message.parts]);

  return (
    <>
      <DropdownMenuItem onClick={handleCopy}>
        <CopyIcon className="mr-2" size={16} />
        Copy message
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DeleteMessageMenuItem messageId={props.message.id} />
    </>
  );
}

type DeleteMessageMenuItemProps = {
  messageId: string;
};

function DeleteMessageMenuItem(props: DeleteMessageMenuItemProps) {
  const { setMessages } = useChatActions<PersonaUIMessage>();
  const storeApi = useChatStoreApi<PersonaUIMessage>();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteMessageAction(props.messageId);

      // Read messages imperatively to avoid subscribing to every change
      const messages = storeApi.getState().messages;

      // Build parent→children index for O(n) traversal instead of O(n*m)
      const childrenByParent = new Map<string, string[]>();
      for (const msg of messages) {
        const pid = msg.metadata?.parentId;
        if (pid) {
          const siblings = childrenByParent.get(pid);
          if (siblings) siblings.push(msg.id);
          else childrenByParent.set(pid, [msg.id]);
        }
      }

      // Collect all descendant message IDs using the index
      const messageIdsToRemove = new Set<string>();
      const stack = [props.messageId];
      while (stack.length > 0) {
        const id = stack.pop()!;
        messageIdsToRemove.add(id);
        const children = childrenByParent.get(id);
        if (children) stack.push(...children);
      }

      // Filter out the deleted message and all its descendants
      setMessages(messages.filter((msg) => !messageIdsToRemove.has(msg.id)));

      toast.success("Message deleted");
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          disabled={isDeleting}
        >
          <Trash03 />
          Delete message
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete message?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this message and all reply branches
            that follow from it. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type EditMessageProps = {
  messageId: string;
  parentId: string | null;
  parts: PersonaUIMessage["parts"];
};

function EditMessage(props: EditMessageProps) {
  const { setEditMessageId, modelId } = useChatMain();
  const { regenerate, setMessages } = useChatActions<PersonaUIMessage>();
  const { addMessageToBranch } = useChatBranchesContext();
  const messages = useChatMessages<PersonaUIMessage>();

  const initialMessage = props.parts.find((p) => p.type === "text")?.text ?? "";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

    setMessages(
      messages.map((stateMessage) =>
        stateMessage.id === props.messageId
          ? {
              ...stateMessage,
              ...editedMessage,
            }
          : stateMessage,
      ),
    );

    regenerate({
      messageId: editedMessage.id,
      body: {
        event: "edit_message",
        modelId,
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
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit}>
        <Textarea
          name="message"
          placeholder="Enter edited message..."
          className="min-h-[80px] resize-none"
          defaultValue={initialMessage}
        />

        <ButtonGroup className="justify-end mt-3">
          <Button
            onClick={() => {
              setEditMessageId(null);
            }}
            size="sm"
            variant="outline"
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

/**
 * Custom hook to efficiently determine if a message is the last one during streaming.
 * Uses store selector for O(1) lookups and fine-grained re-renders.
 */
function useIsLastMessageStreaming(messageId: string) {
  return useChatStore((state) => {
    const messages = state.messages;
    const isLastMessage =
      messages.length > 0 && messages[messages.length - 1]?.id === messageId;
    return isLastMessage && state.status === "streaming";
  });
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
    <div className="flex gap-2 items-center group-[.is-user]:justify-end pointer-fine:hover:opacity-100 transition-opacity duration-250">
      {message.role === "assistant" && (
        <>
          <ChatMessageRegenerate
            messageId={message.id}
            parentId={message.metadata?.parentId}
          />
        </>
      )}
      {shouldShowLoadingIndicator ? (
        <div className="flex items-center justify-center px-2">
          <Spinner className="size-4" />
        </div>
      ) : (
        <ChatMessageBranches
          messageId={message.id}
          parentId={message.metadata?.parentId}
        />
      )}

      {message.role === "assistant" && (
        <>
          <ChatMessageGenerateImageButton messageId={message.id} />
        </>
      )}

      {message.role === "user" && (
        <>
          <ChatMessageEditButton messageId={message.id} />
        </>
      )}
    </div>
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
      variant="ghost"
      disabled={editMessageId === props.messageId}
      onClick={() => {
        setEditMessageId(props.messageId);
      }}
    >
      <Edit04 strokeWidth={1} />
    </Button>
  );
}

type ChatMessageRegenerateProps = {
  messageId: string;
  parentId?: string | null;
};

function ChatMessageRegenerate(props: ChatMessageRegenerateProps) {
  const { messageId, parentId } = props;

  const { regenerate } = useChatActions<PersonaUIMessage>();
  const status = useChatStatus();
  const { modelId } = useChatMain();
  const { addMessageToBranch } = useChatBranchesContext();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => {
        // Register the current message in branch state before it gets replaced,
        // so that both the old and new responses appear as switchable siblings.
        addMessageToBranch(parentId ?? null, {
          id: messageId,
          createdAt: new Date(Date.now() - 1000),
        });

        regenerate({
          messageId,
          body: {
            event: "regenerate",
            modelId,
          },
        });
      }}
      disabled={status === "submitted" || status === "streaming"}
    >
      <RefreshCcw05 strokeWidth={1} />
    </Button>
  );
}

type ChatMessageBranchesProps = {
  messageId: string;
  parentId?: string | null;
};

function ChatMessageBranches(props: ChatMessageBranchesProps) {
  const { branches, branchId, setActiveId, prepareScrollRestore, setIsSwitchingBranch } = useChatBranchesContext();
  const { chatId } = useChatMain();
  const { setMessages } = useChatActions<PersonaUIMessage>();

  const branch = branches[props.parentId || ROOT_BRANCH_PARENT_ID] ?? [];

  const idx = branch.findIndex(
    (branchMessage) => branchMessage.id === props.messageId,
  );

  const currentMessageIndex = idx > -1 ? idx : 0;

  const branchSize = branch.length > 0 ? branch.length : 1;

  const handleBranchChange = async (newBranchId: string) => {
    if (newBranchId === branchId) return;

    // Prepare scroll restoration before changing messages
    // This captures the parent message's viewport position
    prepareScrollRestore(props.parentId ?? null);
    setIsSwitchingBranch(true);

    try {
      const newBranchMessages = await fetch(
        `/api/chats/${chatId}/messages?messageId=${newBranchId}`,
      ).then((res) => res.json());

      setActiveId(newBranchMessages.leafId);
      setMessages(newBranchMessages.messages);
    } finally {
      setIsSwitchingBranch(false);
    }
  };

  return (
    <>
      <Button
        size="icon-sm"
        variant="ghost"
        disabled={currentMessageIndex === 0}
        onClick={() => {
          if (currentMessageIndex > 0) {
            handleBranchChange(branch[currentMessageIndex - 1].id);
          }
        }}
      >
        <ChevronLeft strokeWidth={1} />
      </Button>
      <span className="text-[0.75rem] cursor-default pointer-events-none select-none">
        {currentMessageIndex + 1} / {branchSize}
      </span>
      <Button
        size="icon-sm"
        variant="ghost"
        disabled={currentMessageIndex === branchSize - 1}
        onClick={() => {
          if (currentMessageIndex < branchSize - 1) {
            handleBranchChange(branch[currentMessageIndex + 1].id);
          }
        }}
      >
        <ChevronRight strokeWidth={1} />
      </Button>
    </>
  );
}

type ChatMessageGenerateImageButtonProps = {
  messageId: string;
};

function ChatMessageGenerateImageButton(
  props: ChatMessageGenerateImageButtonProps,
) {
  const { chatId, settings } = useChatMain();
  const addImageGenerationRun = useChatImageGenerationStore(
    (state) => state.addImageGenerationRun,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const hasSceneImage = !!settings.sceneImageMediaId;

  const handleGenerateImage = async (
    modelId: ImageModelId,
    mode: ImageGenerationMode,
  ) => {
    try {
      setIsGenerating(true);

      const result = await generateMessageImage(props.messageId, chatId, {
        modelId,
        mode,
      });

      if (!result.success) {
        // Handle error from server action
        const { code, message } = result.error;

        if (code === "CONCURRENT_LIMIT_EXCEEDED") {
          toast.error("Concurrent generation limit reached", {
            description:
              "You've reached the limit of concurrent generations. Upgrade your plan for more.",
          });
        } else if (code === "SCENE_IMAGE_REQUIRED") {
          toast.error("Scene image required", {
            description:
              "Generate a scene image first in chat settings to use character mode.",
          });
        } else if (code === "MODEL_DOES_NOT_SUPPORT_REFERENCE_IMAGES") {
          toast.error("Model incompatible", {
            description:
              "This model doesn't support character mode. Try creative mode instead.",
          });
        } else if (code === "RATE_LIMIT_EXCEEDED") {
          toast.error("Rate limit exceeded", {
            description:
              "You've reached your image generation limit. Please try again later.",
          });
        } else {
          toast.error("Failed to generate image", {
            description: message,
          });
        }
        return;
      }

      // Add to store to track in-progress generation
      addImageGenerationRun(result.data.runId, {
        runId: result.data.runId,
        publicAccessToken: result.data.publicAccessToken,
        messageId: props.messageId,
        chatId: chatId,
        startedAt: Date.now(),
        modelId,
        expectedImageCount: result.data.expectedImageCount,
        status: "PENDING",
      });
    } catch (error) {
      // Handle unexpected errors (network issues, etc.)
      console.error("Failed to generate image:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to generate image", {
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isGenerating}
          title="Generate image for this message"
        >
          {isGenerating ? (
            <Spinner className="size-4" />
          ) : (
            <Image03 strokeWidth={1.5} />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        {/* Character Mode Section */}
        {hasSceneImage && (
          <>
            <DropdownMenuLabel>Character Mode</DropdownMenuLabel>
            {CHARACTER_MODE_MODELS.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => handleGenerateImage(model.id, "character")}
                disabled={isGenerating}
              >
                <div className="flex items-center w-full justify-between gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {model.displayName}
                    {isModelNew(model.id) && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 h-auto border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                      >
                        New
                      </Badge>
                    )}
                    {isModelBeta(model.id) && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 h-auto border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      >
                        Beta
                      </Badge>
                    )}
                  </div>
                  {model.cost > 1 && (
                    <span className="text-yellow-800 bg-yellow-200 p-1 text-xs rounded">
                      <SparkleIcon size={12} />
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Creative Mode Section */}
        <DropdownMenuLabel>Creative Mode</DropdownMenuLabel>
        {CREATIVE_MODE_MODELS.map((model) => (
          <DropdownMenuItem
            key={`creative-${model.id}`}
            onClick={() => handleGenerateImage(model.id, "creative")}
            disabled={isGenerating}
          >
            <div className="flex items-center w-full justify-between gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {model.displayName}
                {isModelBeta(model.id) && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0.5 h-auto border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  >
                    Beta
                  </Badge>
                )}
              </div>
              {model.cost > 1 && (
                <span className="text-yellow-800 bg-yellow-200 p-1 text-xs rounded">
                  <SparkleIcon size={12} />
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
