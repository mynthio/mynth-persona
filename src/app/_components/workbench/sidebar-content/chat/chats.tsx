"use client";

import { usePersonaChatsQuery } from "@/app/_queries/use-persona-chats.query";
// removed MiniWaveLoader import
import { useChatId } from "@/hooks/use-chat-id.hook";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
// removed Button and Badge imports
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function Chats() {
  const [personaId] = usePersonaId();
  const [chatId, setChatId] = useChatId();

  const { data, isLoading } = usePersonaChatsQuery(personaId);

  return (
    <ScrollArea className="h-full min-h-0 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Padding moved inside to avoid affecting the viewport sizing */}
      <div className="p-2">
        {/* Keep loading/empty states as needed */}
        {/* {!isLoading && (!data || data.length === 0) && (
          <div className="flex-1 min-h-0 flex items-center justify-center p-3">
            <div className="text-xs text-muted-foreground">No chats yet</div>
          </div>
        )} */}

        <div className="flex items-center justify-end w-full">
          <Button variant="outline" onClick={() => setChatId(null)}>
            New chat
          </Button>
        </div>

        {!isLoading && data && data.length > 0 && (
          <div className="mt-4 flex flex-col gap-1 justify-self-start justify-start w-full min-w-0 max-w-full">
            {data.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setChatId(chat.id)}
                className={cn(
                  // Ensure the button never exceeds the container and truncates content
                  "block w-full min-w-0 max-w-full text-left rounded-md border border-border px-3 py-2 transition-colors bg-white",
                  "hover:bg-muted/50",
                  chatId === chat.id && "border-zinc-400"
                )}
              >
                <div className="flex items-center w-full max-w-full min-w-0">
                  <div className="truncate font-medium flex-1 min-w-0">
                    {chat.title ?? "Untitled"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
