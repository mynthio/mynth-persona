"use client";

import { createChatWithScenarioAction } from "@/actions/create-chat-with-scenario.action";
import { Button } from "./mynth-ui/base/button";
import { toastManager } from "./ui/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserChatsMutation } from "@/app/_queries/use-user-chats.query";
import posthog from "posthog-js";

type CreateChatWithScenarioButtonProps = React.ComponentProps<typeof Button> & {
  personaId: string;
  scenarioId: string;
};

export function CreateChatWithScenarioButton({
  personaId,
  scenarioId,
  ...props
}: CreateChatWithScenarioButtonProps) {
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
          posthog.capture("create_chat_with_scenario_clicked", {
            path:
              typeof window !== "undefined"
                ? window.location.pathname
                : undefined,
            scenarioId,
            personaId,
          });
        } catch {}
        toastManager.promise(
          createChatWithScenarioAction({ personaId, scenarioId })
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
              title: "Creating chat with scenario. This may take few seconds in some cases...",
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
