"use client";

import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { useChatActions, useChatMessages } from "@ai-sdk-tools/store";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { ButtonGroup } from "@/components/ui/button-group";
import { Textarea } from "@/components/ui/textarea";

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
