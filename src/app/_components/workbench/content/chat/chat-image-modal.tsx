"use client";

import { useMemo } from "react";
import { ImageDialog, ImageDialogContent } from "@/components/ui/image-dialog";
import { useChatMessageId } from "@/hooks/use-chat-message-id.hook";
import { useChatContext } from "@/app/(chat)/_contexts/chat.context";
import { getImageUrl } from "@/lib/utils";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";

export default function ChatImageModal() {
  const [messageId, setMessageId] = useChatMessageId();
  const isOpen = Boolean(messageId);
  const { chat } = useChatContext();

  // Find message in Chat SDK state by id
  const message: PersonaUIMessage | undefined = useMemo(() => {
    if (!messageId) return undefined;
    return chat.messages.find((m) => m.id === messageId);
  }, [messageId, chat.messages]);

  const imagePart = useMemo(() => {
    return message?.parts.find((p: any) => p.type === "file") as
      | { type: "file"; url: string }
      | undefined;
  }, [message]);

  const textContent = useMemo(() => {
    return (message?.parts || [])
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("\n\n");
  }, [message]);

  const fullUrl = useMemo(() => {
    if (!imagePart) return null;
    // If file part.url is an image id, resolve via getImageUrl
    return getImageUrl(imagePart.url, "full");
  }, [imagePart]);

  const handleClose = () => setMessageId(null);

  return (
    <ImageDialog
      open={isOpen}
      onOpenChange={(open) => (open ? null : handleClose())}
    >
      <ImageDialogContent
        title={message ? `Message ${message.id}` : "Image"}
        image={
          <div className="relative h-full w-full p-4">
            {fullUrl && (
              <>
                <img
                  src={fullUrl}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover blur-lg scale-110"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/25" />
                <img
                  src={fullUrl}
                  alt="Chat image"
                  className="relative z-10 w-full h-full object-contain select-none"
                  draggable={false}
                />
              </>
            )}
          </div>
        }
        box={
          <div className="space-y-4">
            {textContent ? (
              <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap break-words">
                {textContent}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No text content in this message.
              </div>
            )}
          </div>
        }
      />
    </ImageDialog>
  );
}
