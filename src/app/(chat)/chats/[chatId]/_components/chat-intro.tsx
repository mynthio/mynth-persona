"use client";

import { Button } from "@/components/ui/button";
import { useChatActions, useMessageCount } from "../_store/hooks";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { ChatMode } from "@/schemas/backend/chats/chat.schema";
import { useChatMain } from "../_contexts/chat-main.context";
import { updateChatAction } from "@/actions/update-chat.action";
import { useRef, useState } from "react";
import { getModelTips } from "@/data/model-tips";
import { Lightbulb01 } from "@untitledui/icons";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";

export function ChatIntro() {
  const messagesCount = useMessageCount();
  const { personas } = useChatPersonas();
  const { sendMessage } = useChatActions();
  const { modelId } = useChatMain();

  const autoplayPlugin = useRef(
    Autoplay({ delay: 12000, stopOnInteraction: true })
  );

  if (messagesCount > 0) return null;

  const persona = personas[0];
  const tips = getModelTips(modelId);
  const modelDisplayName = modelId
    ? textGenerationModels[modelId]?.displayName ?? null
    : null;

  return (
    <div className="text-center items-center justify-end mb-2 flex min-w-0 flex-col gap-6 text-balance text-surface-foreground/80 w-full">
      {tips.length > 0 && (
        <div className="w-full min-w-0 max-w-2xl mt-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Carousel
            plugins={[autoplayPlugin.current]}
            opts={{ loop: true }}
            className="w-full px-4"
            onMouseEnter={autoplayPlugin.current.stop}
            onMouseLeave={autoplayPlugin.current.reset}
          >
            <CarouselContent>
              {tips.map((tip) => (
                <CarouselItem key={tip.id}>
                  <div className="w-full max-w-full min-w-0 flex flex-col">
                    <div className="text-muted-foreground/80 flex items-center gap-2 justify-center mb-2 w-full wrap-anywhere">
                      <Lightbulb01 strokeWidth={1.5} className="size-3.5" />
                      <p className="text-md">{modelDisplayName}</p>
                    </div>
                    <p className="text-center text-balance wrap-anywhere text-muted-foreground">
                      {tip.content}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 mb-2 w-full min-w-0 shrink max-w-2xl px-4">
        <Button
          size="sm"
          variant="default"
          className="w-full sm:w-auto"
          onClick={() =>
            sendMessage(undefined, {
              body: {
                event: "regenerate",
              },
            })
          }
        >
          Let {persona.name} start
        </Button>
      </div>
    </div>
  );
}

function SwitchModeButton(props: { newMode: ChatMode }) {
  const { chatId, setMode } = useChatMain();
  const [isUpdating, setIsUpdating] = useState(false);

  const label =
    props.newMode === "roleplay"
      ? "Switch to Roleplay Mode"
      : "Switch to Story Mode";

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
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isUpdating}
      className="w-full sm:w-auto"
    >
      {label}
    </Button>
  );
}
