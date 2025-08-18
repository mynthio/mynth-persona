"use client";

import { useChatId } from "@/hooks/use-chat-id.hook";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatQuery } from "@/app/_queries/use-chat.query";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import ChatSettingsForm from "./chat-settings-form";

export default function Settings() {
  const [chatId] = useChatId();

  // Fetch chat details (id, title, mode, settings, createdAt, updatedAt)
  const { data: chat, isLoading } = useChatQuery(chatId);

  if (!chatId) {
    return (
      <div className="h-full min-h-0 max-h-full flex flex-col">
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          <div className="w-full rounded-md border border-zinc-200/60 bg-zinc-50 p-4 text-sm text-zinc-700 max-w-sm text-center">
            <div className="font-medium mb-1">Select a chat first</div>
            <p className="text-[12px] leading-relaxed text-zinc-600">
              Pick a conversation from the Chats tab to configure its settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !chat) {
    return (
      <div className="flex items-center justify-center h-32">
        <CircleNotchIcon className="animate-spin" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full flex flex-col px-2 pb-2">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-4 p-1">
          <ChatSettingsForm chat={chat} />
        </div>
      </div>
    </ScrollArea>
  );
}
