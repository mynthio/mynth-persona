"use client";

import { createChatAction } from "@/actions/create-chat.action";
import { Button } from "./mynth-ui/base/button";
import { toastManager } from "./ui/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserChatsMutation } from "@/app/_queries/use-user-chats.query";
import posthog from "posthog-js";

type CreateChatButtonProps = React.ComponentProps<typeof Button> & {
  personaId: string;
};

export function CreateChatButton({
  personaId,
  ...props
}: CreateChatButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const mutate = useUserChatsMutation();
  const { push } = useRouter();

  return (
    <Button
      {...props}
      disabled={isLoading}
      onClick={async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
          posthog.capture("create_chat_clicked", {
            path: typeof window !== "undefined" ? window.location.pathname : undefined,
          });
        } catch {}
        toastManager.promise(
          createChatAction(personaId)
            .catch((error) => {
              if (error.message === "NEXT_REDIRECT") {
                return "redirect";
              }
              throw error;
            })
            .then((createdChat: any) => {
              mutate((state) =>
                state
                  ? { ...state, data: [createdChat, ...state.data] }
                  : undefined
              );
              push(`/chats/${createdChat.id}`);
              return createdChat;
            })
            .finally(() => {
              setIsLoading(false);
            }),
          {
            loading: {
              title: "Creating chat for persona. This may take few seconds in some cases...",
            },
            success: () => ({
              title: "Chat created successfully, you're going to be redirected to chat now.",
            }),
            error: () => ({
              title: "Failed to create chat, please try again later or contact support.",
            }),
          }
        );
      }}
    />
  );
}
