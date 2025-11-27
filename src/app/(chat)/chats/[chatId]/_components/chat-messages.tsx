"use client";

import React, { useCallback, useMemo } from "react";

import { useEffect, useRef, useState } from "react";
import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChatActions,
  useChatError,
  useChatMessages,
  useChatStatus,
} from "@ai-sdk-tools/store";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import {
  ArrowsCounterClockwiseIcon,
  BrainIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CircleNotchIcon,
  CopyIcon,
  PencilSimpleIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Response } from "@/components/ai-elements/response";
import { nanoid } from "nanoid";
import { useUser } from "@clerk/nextjs";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { cn, getImageUrl } from "@/lib/utils";
import { ApiChatMessagesResponse } from "@/app/(chat)/api/chats/[chatId]/messages/route";
import { Link } from "@/components/ui/link";
import { Label } from "@/components/ui/label";
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
import { useChatImageGenerationStore } from "@/stores/chat-image-generation.store";
import { SWRConfig } from "swr";
import { ImageIcon } from "@phosphor-icons/react/dist/ssr";
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

  const { chatId } = useChatMain();

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef(0);
  const previousScrollYRef = useRef(0);

  const [justPrepended, setJustPrepended] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  // Use the passed ref or fallback to internal ref
  const containerRef = props.containerRef || internalContainerRef;

  // Use messages from the store (Provider handles initial messages)
  const displayMessages = messages;

  // Add bottom padding when streaming to create space for assistant response
  const isStreaming = status === "streaming" || status === "submitted";
  // Provide baseline space for sticky prompt; expand slightly while streaming
  const dynamicPaddingBottom = isStreaming
    ? "clamp(160px, 24vh, 360px)"
    : "128px";

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
      setMessages([...newMessages, ...messages]);

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

  const getErrorObject = (error: string) => {
    try {
      return JSON.parse(error);
    } catch {
      return { message: error };
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full max-w-3xl mx-auto transition-[padding] duration-300 relative z-0"
      style={{ paddingBottom: dynamicPaddingBottom }}
    >
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
  const { editMessageId, chatId } = useChatMain();
  const imageGenerationRuns = useChatImageGenerationStore(
    (state) => state.imageGenerationRuns
  );
  const removeImageGenerationRun = useChatImageGenerationStore(
    (state) => state.removeImageGenerationRun
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
      (r) => r.messageId === props.message.id
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
          messageMediaIds.has(img.mediaId)
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
                  key={partIndex}
                  messageId={props.message.id}
                  part={part}
                />
              ))}

              <ChatMessageImages
                media={props.message.metadata?.media}
                inProgressRuns={inProgressRuns}
              />

              {inProgressRuns.length > 0 &&
                inProgressRuns.map((run) => (
                  <ChatMessageImageInProgress key={run.runId} run={run} />
                ))}
            </>
          )}
        </MessageContent>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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
        .join("")
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
  const messages = useChatMessages<PersonaUIMessage>();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteMessageAction(props.messageId);

      // Remove the message and all its children from state
      const messageIdsToRemove = new Set<string>();

      // Helper function to collect all descendant message IDs
      const collectDescendants = (parentId: string) => {
        messageIdsToRemove.add(parentId);
        messages.forEach((msg) => {
          if (msg.metadata?.parentId === parentId) {
            collectDescendants(msg.id);
          }
        });
      };

      collectDescendants(props.messageId);

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
  const { setEditMessageId } = useChatMain();
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
    <div className="flex gap-2 items-center group-[.is-user]:justify-end pointer-fine:hover:opacity-100 transition-opacity duration-250">
      {message.role === "assistant" && (
        <>
          <ChatMessageRegenerate messageId={message.id} />
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
};

function ChatMessageRegenerate(props: ChatMessageRegenerateProps) {
  const { messageId } = props;

  const { regenerate } = useChatActions<PersonaUIMessage>();
  const status = useChatStatus();

  return (
    <Button
      variant="ghost"
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
      <RefreshCcw05 strokeWidth={1} />
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
  const { setMessages } = useChatActions<PersonaUIMessage>();

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
  props: ChatMessageGenerateImageButtonProps
) {
  const { chatId, settings } = useChatMain();
  const addImageGenerationRun = useChatImageGenerationStore(
    (state) => state.addImageGenerationRun
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // Get character mode models (support reference images)
  const characterModeModels = useMemo(
    () =>
      Object.values(IMAGE_MODELS).filter((model) =>
        supportsReferenceImages(model.id)
      ),
    []
  );

  // Get creative mode models (all models)
  const creativeModeModels = useMemo(() => Object.values(IMAGE_MODELS), []);

  const hasSceneImage = !!settings.sceneImageMediaId;

  const handleGenerateImage = async (
    modelId: ImageModelId,
    mode: ImageGenerationMode
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
            {characterModeModels.map((model) => (
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
        {creativeModeModels.map((model) => (
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
