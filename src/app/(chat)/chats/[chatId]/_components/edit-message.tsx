"use client";

import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { useChatActions, useChatMessages } from "@ai-sdk-tools/store";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { CheckIcon, XIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { TextareaAutosize } from "@/components/ui/textarea";

type EditMessageProps = {
  messageId: string;
  parentId: string | null;
  parts: PersonaUIMessage["parts"];
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(value.length, value.length);
    }
  }, []);

  const hasText = value.trim().length > 0;

  const handleSubmit = (event: React.FormEvent) => {
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    } else if (event.key === "Escape") {
      setEditMessageId(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
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
          <CheckIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setEditMessageId(null)}
        >
          <XIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}
