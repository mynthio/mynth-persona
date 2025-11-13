"use client";

import Link from "next/link";
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
import { MessageChatCircle } from "@untitledui/icons";

export function NavChats() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, mutate } = useUserChatsQuery();
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  const chats = data?.data ?? [];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      {/* <SidebarInput placeholder="Type to search..." /> */}
      <SidebarMenu>
        {chats.slice(0, 10).map((chat) => (
          <SidebarMenuItem key={chat.id}>
            <SidebarMenuButton asChild className="[&>svg]:size-3 font-normal">
              <Link href={`/chats/${chat.id}`}>
                <MessageChatCircle strokeWidth={1.5} className="size-1" />
                <span className="truncate">{chat.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
