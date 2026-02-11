"use client";

import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { useChatActions, useChatMessages } from "@ai-sdk-tools/store";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  Cancel01Icon,
  GitBranchIcon,
} from "@hugeicons/core-free-icons";
import { useState, useRef, useEffect, useTransition } from "react";
import { TextareaAutosize } from "@/components/ui/textarea";
import { editAssistantMessageAction } from "@/actions/edit-assistant-message.action";
import { toast } from "sonner";

type EditMessageProps = {
  messageId: string;
  parentId: string | null;
  parts: PersonaUIMessage["parts"];
  role: "user" | "assistant";
};

export function EditMessage(props: EditMessageProps) {
  const { setEditMessageId, modelId, authorNote } = useChatMain();
  const { regenerate, setMessages } = useChatActions<PersonaUIMessage>();
  const { addMessageToBranch } = useChatBranchesContext();
  const messages = useChatMessages<PersonaUIMessage>();
  const [value, setValue] = useState(
    props.parts.find((p) => p.type === "text")?.text ?? "",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(value.length, value.length);
    }
  }, []);

  const hasText = value.trim().length > 0;
  const originalText = props.parts.find((p) => p.type === "text")?.text ?? "";
  const hasChanged = value !== originalText;

  // User message edit: creates new message + regenerates AI response
  const handleUserSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!hasText) return;

    const editedMessage = {
      id: `msg_${nanoid(32)}`,
      role: "user",
      parts: [{ type: "text", text: value }],
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
        authorNote,
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

  // Assistant message edit: update in place (no branching, no AI call)
  const handleAssistantUpdate = () => {
    if (!hasText || !hasChanged) return;

    startTransition(async () => {
      try {
        await editAssistantMessageAction({
          messageId: props.messageId,
          text: value,
          mode: "update",
        });

        // Update local state in place
        setMessages(
          messages.map((msg) =>
            msg.id === props.messageId
              ? {
                  ...msg,
                  parts: [{ type: "text" as const, text: value }],
                }
              : msg,
          ),
        );

        setEditMessageId(null);
      } catch {
        toast.error("Failed to update message");
      }
    });
  };

  // Assistant message edit: save as new branch (creates branch, no AI call)
  const handleAssistantSaveAsNew = () => {
    if (!hasText) return;

    startTransition(async () => {
      try {
        const result = await editAssistantMessageAction({
          messageId: props.messageId,
          text: value,
          mode: "save_as_new",
        });

        if (result.mode !== "save_as_new") return;

        const newMessage = {
          id: result.messageId,
          role: "assistant",
          parts: [{ type: "text" as const, text: value }],
          metadata: {
            ...((messages.find((m) => m.id === props.messageId)
              ?.metadata as Record<string, unknown>) ?? {}),
            parentId: props.parentId,
          },
        } as PersonaUIMessage;

        // Replace the current message with the new one and remove all
        // descendants — the new branch has no children yet.
        const editedIndex = messages.findIndex(
          (m) => m.id === props.messageId,
        );
        const kept = messages.slice(0, editedIndex);
        kept.push({ ...messages[editedIndex], ...newMessage });
        setMessages(kept);

        // Register both old and new messages as branch siblings
        addMessageToBranch(props.parentId, {
          id: props.messageId,
          createdAt: new Date(Date.now() - 1000),
        });

        addMessageToBranch(props.parentId, {
          id: result.messageId,
          createdAt: new Date(),
        });

        setEditMessageId(null);
      } catch {
        toast.error("Failed to save message as new branch");
      }
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (props.role === "user") {
        handleUserSubmit(event);
      } else {
        handleAssistantUpdate();
      }
    } else if (event.key === "Escape") {
      setEditMessageId(null);
    }
  };

  if (props.role === "user") {
    return (
      <form onSubmit={handleUserSubmit} className="flex flex-col gap-2 w-full">
        <TextareaAutosize
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full grow focus-visible:border-none focus-visible:ring-0 focus-visible:bg-transparent shadow-none dark:shadow-none dark:bg-transparent border-none min-w-[200px] min-h-[24px] bg-transparent text-base md:text-lg text-foreground outline-none resize-none p-0 leading-relaxed"
        />
        <div className="flex items-center gap-1">
          <Button
            type="submit"
            size="icon-xs"
            variant="ghost"
            className="h-6 w-6"
            disabled={!hasText}
          >
            <HugeiconsIcon icon={Tick02Icon} size={14} />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setEditMessageId(null)}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </Button>
        </div>
      </form>
    );
  }

  // Assistant message edit UI with two modes
  return (
    <div className="flex flex-col gap-2 w-full">
      <TextareaAutosize
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        className="w-full grow focus-visible:border-none focus-visible:ring-0 focus-visible:bg-transparent shadow-none dark:shadow-none dark:bg-transparent border-none min-w-[200px] min-h-[24px] bg-transparent text-base md:text-lg text-foreground outline-none resize-none p-0 leading-relaxed"
      />
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          disabled={!hasText || !hasChanged || isPending}
          onClick={handleAssistantUpdate}
        >
          <HugeiconsIcon icon={Tick02Icon} size={14} />
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          disabled={!hasText || isPending}
          onClick={handleAssistantSaveAsNew}
        >
          <HugeiconsIcon icon={GitBranchIcon} size={14} />
          Save as New
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="h-6 w-6"
          disabled={isPending}
          onClick={() => setEditMessageId(null)}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} />
        </Button>
      </div>
    </div>
  );
}
