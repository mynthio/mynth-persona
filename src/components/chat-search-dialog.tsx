"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MessageChatCircle,
  ArrowRight,
  SearchMd,
} from "@untitledui/icons";
import { useDebounce } from "@uidotdev/usehooks";

import {
  Dialog,
  DialogContentCustom,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // We only fetch when the dialog is open to save resources
  const { data, isLoading } = useUserChatsQuery(
    open ? { q: debouncedQuery } : null
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
        setSelectedIndex(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Reset selection when results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [chats.length]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, chats.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && chats[selectedIndex]) {
      e.preventDefault();
      handleSelect(chats[selectedIndex].id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentCustom
        overlay={
          <DialogOverlay className="bg-black/60 dark:bg-black/80 backdrop-blur-sm" />
        }
        showCloseButton={false}
        className="w-[95vw] sm:max-w-xl shadow-2xl p-0 gap-0 overflow-hidden border-border/50 dark:border-white/10 rounded-2xl dark:bg-[#0c0c0f]"
      >
        {/* Subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-primary/[0.01] dark:from-violet-500/[0.03] dark:via-transparent dark:to-violet-500/[0.02]" />

        <DialogHeader className="relative p-0 border-b border-border/50 dark:border-white/10">
          <DialogTitle className="sr-only">Search Chats</DialogTitle>

          <div className="flex items-center gap-3 px-4 py-4">
            <SearchMd
              strokeWidth={1.5}
              className="size-5 text-muted-foreground/70 shrink-0"
            />
            <input
              ref={inputRef}
              className="flex-1 bg-transparent outline-none border-none shadow-none w-full placeholder:text-muted-foreground/60 text-[15px] font-normal"
              placeholder="Search your conversations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="h-[min(50vh,400px)] relative">
          <div className="p-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="size-12 rounded-full bg-muted/50 dark:bg-white/5 flex items-center justify-center">
                  <MessageChatCircle className="size-6 text-muted-foreground/50" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {query ? "No conversations found" : "Search your chats"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {query ? "Try a different search term" : "Type to find past conversations"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {chats.map((chat, index) => (
                  <button
                    key={chat.id}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150",
                      "hover:bg-muted/60 dark:hover:bg-white/[0.06]",
                      "focus:outline-none focus:bg-muted/60 dark:focus:bg-white/[0.06]",
                      "group",
                      selectedIndex === index && "bg-muted/60 dark:bg-white/[0.06]"
                    )}
                    onClick={() => handleSelect(chat.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="size-9 rounded-lg bg-primary/5 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 dark:group-hover:bg-white/10 transition-colors">
                      <MessageChatCircle className="size-4 text-primary/70 dark:text-white/70" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground/90">
                        {chat.title || "Untitled Chat"}
                      </p>
                      {chat.updatedAt && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {new Date(chat.updatedAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: new Date(chat.updatedAt).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
                            }
                          )}
                          {" · "}
                          {new Date(chat.updatedAt).toLocaleTimeString(
                            undefined,
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with keyboard hints */}
        <div className="relative border-t border-border/50 dark:border-white/10 px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted/50 dark:bg-white/5 font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-muted/50 dark:bg-white/5 font-mono">↓</kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted/50 dark:bg-white/5 font-mono">↵</kbd>
              <span className="ml-1">Open</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted/50 dark:bg-white/5 font-mono">Esc</kbd>
            <span className="ml-1">Close</span>
          </span>
        </div>
      </DialogContentCustom>
    </Dialog>
  );
}
