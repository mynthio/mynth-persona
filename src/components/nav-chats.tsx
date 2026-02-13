"use client";

import { Link } from "@/components/ui/link";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUserChatsQuery } from "@/app/_queries/use-user-chats.query";
import { useState } from "react";
import { ChatSearchDialog } from "./chat-search-dialog";
import { useAuth } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { BubbleChatIcon, Chat01Icon, Message01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function NavChats() {
  const { data, isLoading } = useUserChatsQuery();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { state } = useSidebar();

  const { isSignedIn } = useAuth();
  const chats = data?.data ?? [];
  const isCollapsed = state === "collapsed";

  if (!isSignedIn) return null;

  return (
    <>
      {isCollapsed ? (
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Search chats"
                onClick={() => setIsSearchOpen(true)}
              >
                <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} />
                <span>Search chats</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      ) : (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between mb-1">
            <SidebarGroupLabel className="mb-0">Recent Chats</SidebarGroupLabel>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
              onClick={() => setIsSearchOpen(true)}
            >
              <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="size-3.5" />
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
                    <HugeiconsIcon icon={Message01Icon} />
                    <span className="truncate">{chat.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}

      <ChatSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
