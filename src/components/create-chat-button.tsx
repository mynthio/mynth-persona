"use client";

import { createChatAction } from "@/actions/create-chat.action";
import { Button } from "./ui/button";
import { useToast } from "./ui/toast";
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
  const { promise } = useToast();
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
        promise(
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
            })
            .finally(() => {
              setIsLoading(false);
            }),
          {
            loading:
              "Creating chat for persona. This may take few seconds in some cases...",
            error: (error) =>
              `Failed to create chat, please try again later or contact support.`,
            success:
              "Chat created successfully, you're going to be redirected to chat now.",
          }
        );
      }}
    />
  );
}
