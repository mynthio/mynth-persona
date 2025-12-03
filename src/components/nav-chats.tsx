"use client";

import { Link } from "@/components/ui/link";
import { useRouter, usePathname } from "next/navigation";

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
import { MessageChatCircle, SearchMd } from "@untitledui/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { ChatSearchDialog } from "./chat-search-dialog";
import { useAuth } from "@clerk/nextjs";

export function NavChats() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, mutate } = useUserChatsQuery();
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { isSignedIn } = useAuth();
  const chats = data?.data ?? [];

  if (!isSignedIn) return null;

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        {/* <SidebarGroupLabel>Chats</SidebarGroupLabel> */}
        {/* <SidebarInput placeholder="Type to search..." /> */}
        <InputGroup
          className="h-8 cursor-pointer"
          onClick={() => setIsSearchOpen(true)}
        >
          <InputGroupInput
            className="text-xs font-light placeholder:font-light placeholder:text-xs tracking-tight h-7 py-0.5 cursor-pointer"
            placeholder="Search chats..."
            readOnly
          />
          <InputGroupAddon>
            <SearchMd strokeWidth={1.5} className="size-3" />
          </InputGroupAddon>
        </InputGroup>

        <SidebarMenu className="mt-2">
          {chats.slice(0, 10).map((chat) => (
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
