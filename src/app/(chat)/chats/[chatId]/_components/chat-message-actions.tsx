"use client";

import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChatActions,
  useChatStatus,
  useChatStore,
} from "@ai-sdk-tools/store";
import { Button } from "@/components/ui/button";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";
import { Spinner } from "@/components/ui/spinner";
import {
  ChevronLeft,
  ChevronRight,
  Edit04,
  RefreshCcw05,
} from "@untitledui/icons";
import { ChatMessageGenerateImageButton } from "./chat-message-generate-image-button";

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

type ChatMessageActionsProps = {
  message: PersonaUIMessage;
};

export function ChatMessageActions(props: ChatMessageActionsProps) {
  const { message } = props;

  const { editMessageId } = useChatMain();

  // Boolean constant for UI changes - determines when to show loading indicator instead of branches
  const shouldShowLoadingIndicator = useIsLastMessageStreaming(message.id);

  if (editMessageId === message.id) return null;

  return (
    <div className="flex gap-2 items-center group-[.is-user]:justify-end pointer-fine:hover:opacity-100 transition-opacity duration-250">
      {message.role === "assistant" && (
        <ChatMessageRegenerate
          messageId={message.id}
          parentId={message.metadata?.parentId}
        />
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
        <ChatMessageGenerateImageButton messageId={message.id} />
      )}

      {message.role === "user" && (
        <ChatMessageEditButton messageId={message.id} />
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
  const { modelId, authorNote } = useChatMain();
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
            authorNote,
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
  const {
    branches,
    branchId,
    setActiveId,
    prepareScrollRestore,
    setIsSwitchingBranch,
  } = useChatBranchesContext();
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
