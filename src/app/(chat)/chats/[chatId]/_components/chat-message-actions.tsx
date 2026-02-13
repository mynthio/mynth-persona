"use client";

import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChatActions,
  useChatStatus,
} from "../_store/hooks";
import { Button } from "@/components/ui/button";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";
import { useSwitchBranch } from "../_hooks/use-switch-branch.hook";
import { ChatMessageGenerateImageButton } from "./chat-message-generate-image-button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Refresh01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

type ChatMessageActionsProps = {
  message: PersonaUIMessage;
  isStreaming?: boolean;
};

export function ChatMessageActions(props: ChatMessageActionsProps) {
  const { message, isStreaming } = props;

  const { editMessageId } = useChatMain();

  if (editMessageId === message.id) return null;

  // Hide actions entirely while streaming
  if (isStreaming) {
    return null;
  }

  return (
    <div className="flex gap-1.5 items-center text-muted-foreground/70 group-[.is-user]:justify-end pointer-fine:hover:opacity-100 transition-opacity duration-250">
      {message.role === "assistant" && (
        <>
          <ChatMessageGenerateImageButton messageId={message.id} iconOnly />
          <ChatMessageRegenerate
            messageId={message.id}
            parentId={message.metadata?.parentId}
          />
        </>
      )}
      <ChatMessageBranches
        messageId={message.id}
        parentId={message.metadata?.parentId}
      />
    </div>
  );
}

type ChatMessageRegenerateProps = {
  messageId: string;
  parentId?: string | null;
};

function ChatMessageRegenerate(props: ChatMessageRegenerateProps) {
  const { messageId, parentId } = props;

  const { regenerate } = useChatActions();
  const status = useChatStatus();
  const { modelId, authorNote } = useChatMain();
  const { addMessageToBranch } = useChatBranchesContext();

  return (
    <Button
      variant="ghost"
      size="icon-xs"
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
      <HugeiconsIcon icon={Refresh01Icon} size={14} />
    </Button>
  );
}

type ChatMessageBranchesProps = {
  messageId: string;
  parentId?: string | null;
};

function ChatMessageBranches(props: ChatMessageBranchesProps) {
  const { branches, branchId } = useChatBranchesContext();
  const switchBranch = useSwitchBranch();

  const branch = branches[props.parentId || ROOT_BRANCH_PARENT_ID] ?? [];

  const idx = branch.findIndex(
    (branchMessage) => branchMessage.id === props.messageId,
  );

  const currentMessageIndex = idx > -1 ? idx : 0;

  const branchSize = branch.length > 0 ? branch.length : 1;

  const handleBranchChange = (newBranchId: string) => {
    if (newBranchId === branchId) return;
    switchBranch(newBranchId, { parentId: props.parentId ?? null });
  };

  return (
    <>
      <Button
        size="icon-xs"
        variant="ghost"
        disabled={currentMessageIndex === 0}
        onClick={() => {
          if (currentMessageIndex > 0) {
            handleBranchChange(branch[currentMessageIndex - 1].id);
          }
        }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
      </Button>
      <span className="text-[0.75rem] cursor-default pointer-events-none select-none">
        {currentMessageIndex + 1} / {branchSize}
      </span>
      <Button
        size="icon-xs"
        variant="ghost"
        disabled={currentMessageIndex === branchSize - 1}
        onClick={() => {
          if (currentMessageIndex < branchSize - 1) {
            handleBranchChange(branch[currentMessageIndex + 1].id);
          }
        }}
      >
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
      </Button>
    </>
  );
}
