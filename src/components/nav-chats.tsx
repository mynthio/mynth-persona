"use client";

import { Link } from "@/components/ui/link";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUserChatsQuery } from "@/app/_queries/use-user-chats.query";
import { useState } from "react";
import { MessageChatCircle, SearchMd } from "@untitledui/icons";
import { ChatSearchDialog } from "./chat-search-dialog";
import { useAuth } from "@clerk/nextjs";
import { Button } from "./ui/button";

export function NavChats() {
  const { data, isLoading } = useUserChatsQuery();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { isSignedIn } = useAuth();
  const chats = data?.data ?? [];

  if (!isSignedIn) return null;

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between mb-1">
          <SidebarGroupLabel className="mb-0">Recent Chats</SidebarGroupLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
            onClick={() => setIsSearchOpen(true)}
          >
            <SearchMd strokeWidth={1.5} className="size-3.5" />
            <span className="sr-only">Search chats</span>
          </Button>
        </div>

        <SidebarMenu>
          {chats.length === 0 && !isLoading && (
            <p className="text-xs text-muted-foreground px-2.5 py-2">
              No chats yet
            </p>
          )}
          {chats.slice(0, 8).map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton asChild size="sm">
                <Link href={`/chats/${chat.id}`}>
                  <MessageChatCircle strokeWidth={1.5} />
                  <span className="truncate">{chat.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <ChatSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
