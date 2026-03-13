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
import { ChatMessageAudioButton } from "./chat-message-audio-button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Refresh01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PinIcon,
  PinOffIcon,
} from "@hugeicons/core-free-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

type ChatMessageActionsProps = {
  message: PersonaUIMessage;
  isStreaming?: boolean;
  audioId?: string;
  isGeneratingAudio?: boolean;
  onAudioGenerated?: (audioId: string) => void;
  onGeneratingAudioChange?: (generating: boolean) => void;
};

export function ChatMessageActions(props: ChatMessageActionsProps) {
  const { message, isStreaming, audioId, isGeneratingAudio, onAudioGenerated, onGeneratingAudioChange } = props;

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
          <ChatMessageAudioButton
            messageId={message.id}
            audioId={audioId}
            isGenerating={isGeneratingAudio ?? false}
            onAudioGenerated={onAudioGenerated ?? (() => {})}
            onGeneratingChange={onGeneratingAudioChange ?? (() => {})}
          />
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
      <PinMessageButton message={message} />
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

function PinMessageButton({ message }: { message: PersonaUIMessage }) {
  const { pinnedBranches, pinMessage, unpinMessage } = useChatBranchesContext();
  const isPinned = pinnedBranches.some((p) => p.id === message.id);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const getAutoLabel = () => {
    const parts = message.parts;
    for (const part of parts) {
      if (part.type === "text" && part.text) {
        return part.text.slice(0, 60);
      }
    }
    return "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await pinMessage(message.id, label.trim() || getAutoLabel() || undefined);
      toast.success("Branch saved");
      setOpen(false);
      setLabel("");
    } catch {
      toast.error("Failed to save branch");
    } finally {
      setSaving(false);
    }
  };

  const handleUnpin = async () => {
    try {
      await unpinMessage(message.id);
      toast.success("Branch removed");
    } catch {
      toast.error("Failed to remove branch");
    }
  };

  if (isPinned) {
    return (
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleUnpin}
        title="Remove saved branch"
      >
        <HugeiconsIcon icon={PinOffIcon} size={14} />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-xs" title="Save branch">
          <HugeiconsIcon icon={PinIcon} size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="top" align="end">
        <p className="mb-2 text-xs font-medium text-foreground">Save branch</p>
        <Input
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mb-2 h-7 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setOpen(false);
          }}
          autoFocus
        />
        <Button size="xs" className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

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
