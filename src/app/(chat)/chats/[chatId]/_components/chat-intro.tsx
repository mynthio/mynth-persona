"use client";

import { Button } from "@/components/mynth-ui/base/button";
import { useChatActions, useMessageCount } from "@ai-sdk-tools/store";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { getImageUrl } from "@/lib/utils";
import { ChatMode } from "@/schemas/backend/chats/chat.schema";
import { useChatMain } from "../_contexts/chat-main.context";
import { updateChatAction } from "@/actions/update-chat.action";
import { useState } from "react";

export function ChatIntro() {
  const messagesCount = useMessageCount();
  const { personas } = useChatPersonas();
  const { sendMessage } = useChatActions();
  const { navigateSettings } = useSettingsNavigation();
  const { mode } = useChatMain();

  if (messagesCount > 0) return null;

  const persona = personas[0];

  return (
    <div className="text-center flex items-center flex-col gap-[42px] justify-center text-balance text-surface-foreground/80 py-[42px] mt-[42px] shrink-0">
      {persona.profileImageIdMedia && (
        <div className="size-[148px] flex items-center justify-center  relative z-0">
          <img
            src={getImageUrl(persona.profileImageIdMedia, "thumb")}
            className="object-cover w-11/12 h-11/12 rounded-[32px]"
            alt={persona.name}
          />
          <img
            src={getImageUrl(persona.profileImageIdMedia, "thumb")}
            className="object-cover w-full h-full absolute top-0 left-0 rounded-[32px] blur-[18px] -z-1"
            alt={persona.name}
          />
        </div>
      )}

      <p>
        Would you like to{" "}
        <Button
          onClick={() =>
            sendMessage(
              { text: "Hi" },
              {
                body: {
                  event: "send",
                },
              }
            )
          }
        >
          say "Hi" to {persona.name}
        </Button>
        ? <br />
        Or perhaps you want to{" "}
        <Button onClick={() => navigateSettings("scenario")}>
          set some scenario
        </Button>{" "}
        first?
        <br />
        Switch to{" "}
        <SwitchModeButton
          newMode={mode === "roleplay" ? "story" : "roleplay"}
        />{" "}
        mode ?
      </p>
    </div>
  );
}

function SwitchModeButton(props: { newMode: ChatMode }) {
  const { chatId, setMode } = useChatMain();
  const [isUpdating, setIsUpdating] = useState(false);

  const label = props.newMode === "roleplay" ? "Roleplay" : "Story";

  const handleClick = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await updateChatAction(chatId, {
        mode: props.newMode,
      });
      setMode(props.newMode);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={isUpdating}>
      {label}
    </Button>
  );
}
