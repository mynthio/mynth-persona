"use client";

import { Button } from "@/components/mynth-ui/base/button";
import { useChatMessageCount } from "@ai-sdk-tools/store";

type ChatIntroProps = {
  personaName: string;
};

export function ChatIntro(props: ChatIntroProps) {
  const messagesCount = useChatMessageCount();

  if (messagesCount > 0) return null;

  return (
    <div>
      <p className="text-center text-balance text-surface-foreground/80">
        Would you like <Button>{props.personaName} to start</Button>? <br />
        Or perhaps you want to <Button>set some scenario</Button> first?
      </p>
    </div>
  );
}
