"use client";

import { createChatWithScenarioAction } from "@/actions/create-chat-with-scenario.action";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserChatsMutation } from "@/app/_queries/use-user-chats.query";
import posthog from "posthog-js";
import { useAuth, useClerk } from "@clerk/nextjs";

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
  const { isLoaded, isSignedIn } = useAuth();
  const { redirectToSignIn } = useClerk();

  return (
    <Button
      {...props}
      disabled={isLoading || !isLoaded}
      onClick={async () => {
        if (isLoading || !isLoaded) return;

        if (!isSignedIn) {
          await redirectToSignIn({ redirectUrl: window.location.href });
          return;
        }

        setIsLoading(true);
        try {
          posthog.capture("create_chat_with_scenario_clicked", {
            path:
              typeof window !== "undefined"
                ? window.location.pathname
                : undefined,
            scenario_id: scenarioId,
            persona_id: personaId,
          });
        } catch {}
        toast.promise(
          createChatWithScenarioAction({ personaId, scenarioId })
            .then((createdChat: any) => {
              try {
                posthog.capture("chat_created", {
                  origin: "persona_scenario",
                  has_scenario: true,
                });
              } catch {}
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
              "Creating chat with scenario. This may take few seconds in some cases...",
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
