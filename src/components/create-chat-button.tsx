"use client";

import { createChatAction } from "@/actions/create-chat.action";
import { Button } from "./mynth-ui/base/button";
import { useToast } from "./ui/toast";

type CreateChatButtonProps = React.ComponentProps<typeof Button> & {
  personaId: string;
};

export function CreateChatButton({
  personaId,
  ...props
}: CreateChatButtonProps) {
  const { promise } = useToast();

  return (
    <Button
      {...props}
      onClick={async () => {
        promise(
          createChatAction(personaId).catch((error) => {
            if (error.message === "NEXT_REDIRECT") {
              return "redirect";
            }
            throw error;
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
