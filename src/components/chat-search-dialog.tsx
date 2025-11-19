"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  SearchMd,
  MessageChatCircle,
  ArrowRight,
  SearchRefraction,
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
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  ItemMedia,
  ItemActions,
} from "@/components/ui/item";
import { useUserChatsQuery } from "@/app/_queries/use-user-chats.query";
import { Input } from "./ui/input";
import { Spinner } from "./ui/spinner";

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
  // Pass params object when open, null when closed (which disables SWR fetching)
  const { data, isLoading } = useUserChatsQuery(
    open ? { q: debouncedQuery } : null
  );

  const chats = data?.data ?? [];

  const handleSelect = (chatId: string) => {
    router.push(`/chats/${chatId}`);
    onOpenChange(false);
  };

  // Reset query when dialog closes
  React.useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setQuery(""), 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentCustom
        overlay={
          <DialogOverlay className="backdrop-grayscale-100 backdrop-blur-[1px]" />
        }
        showCloseButton={false}
        className="w-11/12 sm:max-w-5xl shadow-none p-0"
      >
        <DialogHeader className="p-0 border-b border-border px-2 md:px-4 lg:px-6 py-4">
          <DialogTitle className="sr-only">Search Chats</DialogTitle>

          <div className="flex items-center gap-3">
            <input
              className="bg-none bg-transparent outline-none border-none shadow-none ring-none w-full placeholder:italic placeholder:text-muted-foreground font-montserrat text-base"
              placeholder="Search chats..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <SearchRefraction
              strokeWidth={1.5}
              className="size-4 text-muted-foreground shrink-0"
            />
          </div>
        </DialogHeader>
        <ScrollArea className="h-[50vh] max-h-[500px]">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center mt-10">
                <Spinner />
              </div>
            ) : chats.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                {query ? "No chats found." : "Start typing to search..."}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {chats.map((chat) => (
                  <Item
                    key={chat.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors rounded-lg px-3 py-3"
                    onClick={() => handleSelect(chat.id)}
                  >
                    <ItemMedia variant="icon">
                      <MessageChatCircle className="size-4" strokeWidth={1.5} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-base">
                        {chat.title || "Untitled Chat"}
                      </ItemTitle>
                      <ItemDescription>
                        {chat.updatedAt && (
                          <span>
                            {new Date(chat.updatedAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                              }
                            )}
                          </span>
                        )}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <ArrowRight className="size-4 text-muted-foreground/50" />
                    </ItemActions>
                  </Item>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContentCustom>
    </Dialog>
  );
}
