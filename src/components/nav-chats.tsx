"use client";

import {
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Plus,
  Loader2,
  BookOpen,
  ChevronRight,
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

export function NavChats() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, mutate } = useUserChatsQuery();
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  const chats = data?.data ?? [];

  const handleDeleteChat = async (chatId: string, chatTitle: string | null) => {
    if (
      !confirm(`Are you sure you want to delete "${chatTitle ?? "this chat"}"?`)
    ) {
      return;
    }

    setDeletingChatId(chatId);

    try {
      const result = await deleteChatAction({ chatId });

      if (result.success) {
        toast.success("Chat deleted successfully");

        // Optimistically update the cache
        mutate(
          (current) => {
            if (!current) return current;
            return {
              ...current,
              data: current.data.filter((chat) => chat.id !== chatId),
            };
          },
          { revalidate: false }
        );

        // Navigate to chats page if we're on the deleted chat page
        if (pathname.includes(chatId)) {
          router.push("/chats");
        }
      } else {
        toast.error(result.error ?? "Failed to delete chat");
      }
    } catch (error) {
      toast.error("Failed to delete chat");
      console.error("Error deleting chat:", error);
    } finally {
      setDeletingChatId(null);
    }
  };

  const getChatIcon = (mode: "roleplay" | "story") => {
    return mode === "story" ? BookOpen : MessageSquare;
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible defaultOpen>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Recent Chats">
              <a href={"/chats"}>Recent Chats</a>
            </SidebarMenuButton>
            {chats.length > 0 ? (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {chats.slice(0, 10).map((chat) => (
                      <SidebarMenuSubItem key={chat.id}>
                        <SidebarMenuSubButton asChild>
                          <a href={`/chats/${chat.id}`}>
                            <span>{chat.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : null}
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
