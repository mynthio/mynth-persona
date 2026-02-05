"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageChatCircle, ArrowRight } from "@untitledui/icons";
import { useDebounce } from "@uidotdev/usehooks";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUserChatsQuery } from "@/app/_queries/use-user-chats.query";
import { cn } from "@/lib/utils";

interface ChatSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatSearchDialog({
  open,
  onOpenChange,
}: ChatSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 300);

  // We only fetch when the dialog is open to save resources
  const { data, isLoading } = useUserChatsQuery(
    open ? { q: debouncedQuery } : null,
  );

  const chats = data?.data ?? [];

  const handleSelect = (chatId: string) => {
    router.push(`/chats/${chatId}`);
    onOpenChange(false);
  };

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setQuery("");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] sm:max-w-xl shadow-2xl p-0 gap-0 overflow-hidden border-border/50 dark:border-white/10 rounded-2xl dark:bg-[#0c0c0f]"
      >
        {/* Subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/2 via-transparent to-primary/1 dark:from-violet-500/3 dark:via-transparent dark:to-violet-500/2" />

        <DialogHeader className="sr-only">
          <DialogTitle>Search Chats</DialogTitle>
        </DialogHeader>

        <Command shouldFilter={false} className="bg-transparent">
          <CommandInput
            placeholder="Search your conversations..."
            value={query}
            onValueChange={setQuery}
            autoFocus
            className="h-12 text-[15px] placeholder:text-muted-foreground/60"
          />

          <CommandList className="max-h-[min(50vh,400px)] p-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Searching...
                </span>
              </div>
            ) : chats.length === 0 ? (
              <CommandEmpty className="py-8">
                <div className="flex flex-col items-center justify-center gap-4 w-full">
                  <div className="size-12 rounded-full bg-muted/50 dark:bg-white/5 flex items-center justify-center">
                    <MessageChatCircle
                      className="size-6 text-muted-foreground/50"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {query ? "No conversations found" : "Search your chats"}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {query
                        ? "Try a different search term"
                        : "Type to find past conversations"}
                    </p>
                  </div>
                </div>
              </CommandEmpty>
            ) : (
              chats.map((chat) => (
                <CommandItem
                  key={chat.id}
                  value={chat.title || "Untitled Chat"}
                  onSelect={() => handleSelect(chat.id)}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors overflow-hidden",
                    "data-[selected=true]:bg-muted/60 data-[selected=true]:text-foreground",
                    "dark:data-[selected=true]:bg-white/6",
                    "data-[selected=true]:shadow-sm",
                  )}
                >
                  <div className="size-9 rounded-lg bg-primary/5 dark:bg-white/5 flex items-center justify-center shrink-0 transition-colors">
                    <MessageChatCircle
                      className="size-4 text-primary/70 dark:text-white/70"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium truncate text-foreground/90 overflow-hidden text-ellipsis whitespace-nowrap">
                      {chat.title || "Untitled Chat"}
                    </p>
                    {chat.updatedAt && (
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {new Date(chat.updatedAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year:
                              new Date(chat.updatedAt).getFullYear() !==
                              new Date().getFullYear()
                                ? "numeric"
                                : undefined,
                          },
                        )}
                        {" · "}
                        {new Date(chat.updatedAt).toLocaleTimeString(
                          undefined,
                          {
                            hour: "numeric",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground/30 transition-transform shrink-0 group-data-[selected=true]:text-muted-foreground/60 group-data-[selected=true]:translate-x-0.5" />
                </CommandItem>
              ))
            )}
          </CommandList>

          <CommandSeparator className="bg-border/50 dark:bg-white/10" />
          <div className="relative px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground/50">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted/50 dark:bg-white/5 font-mono">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-muted/50 dark:bg-white/5 font-mono">
                  ↓
                </kbd>
                <span className="ml-1">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted/50 dark:bg-white/5 font-mono">
                  ↵
                </kbd>
                <span className="ml-1">Open</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted/50 dark:bg-white/5 font-mono">
                Esc
              </kbd>
              <span className="ml-1">Close</span>
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
