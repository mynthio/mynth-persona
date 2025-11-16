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
import { MessageChatCircle, SearchMd } from "@untitledui/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

export function NavChats() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, mutate } = useUserChatsQuery();
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  const chats = data?.data ?? [];

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {/* <SidebarGroupLabel>Chats</SidebarGroupLabel> */}
      {/* <SidebarInput placeholder="Type to search..." /> */}
      <InputGroup className="h-8">
        <InputGroupInput
          className="text-xs placeholder:text-xs h-7 py-0.5"
          placeholder="Search chats..."
        />
        <InputGroupAddon>
          <SearchMd className="size-3" />
        </InputGroupAddon>
      </InputGroup>

      <SidebarMenu className="mt-2">
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
