"use client";

import { createChatAction } from "@/actions/create-chat.action";
import { Button } from "./mynth-ui/base/button";
import { useToast } from "./ui/toast";
import { useSWRConfig } from "swr";
import { useState } from "react";

type CreateChatButtonProps = React.ComponentProps<typeof Button> & {
  personaId: string;
};

export function CreateChatButton({
  personaId,
  ...props
}: CreateChatButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { mutate } = useSWRConfig();
  const { promise } = useToast();

  return (
    <Button
      {...props}
      disabled={isLoading}
      onClick={async () => {
        if (isLoading) return;
        setIsLoading(true);
        promise(
          createChatAction(personaId)
            .catch((error) => {
              if (error.message === "NEXT_REDIRECT") {
                return "redirect";
              }
              throw error;
            })
            .then(() => {
              mutate("/api/chats");
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
