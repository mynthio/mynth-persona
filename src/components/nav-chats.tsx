"use client";

import {
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Plus,
  Loader2,
  BookOpen,
  ChevronRight,
  MessagesSquareIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInput,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserChatsQuery } from "@/app/_queries/use-user-chats.query";
import { useState } from "react";
import { deleteChatAction } from "@/actions/delete-chat.action";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
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
            <SidebarMenuButton
              asChild
              className="rounded-[0.76rem] h-8 text-[0.84rem]"
            >
              <Link href={`/chats/${chat.id}`}>
                <MessageChatCircle className="size-1" />
                {chat.title}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
