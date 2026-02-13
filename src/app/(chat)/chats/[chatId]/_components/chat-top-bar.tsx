"use client";

import {
  Delete02Icon,
  LayoutAlignRightIcon,
  Loading02Icon,
  Menu09Icon,
  Message02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import {
  TopBar,
  TopBarSidebarTrigger,
  TopBarTitle,
} from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { useChatMain } from "../_contexts/chat-main.context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createChatAction } from "@/actions/create-chat.action";
import { deleteChatAction } from "@/actions/delete-chat.action";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

export function ChatTopBar({ className }: { className?: string }) {
  const { sidebarOpen, setSidebarOpen, chatId } = useChatMain();
  const { personas } = useChatPersonas();
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const persona = personas[0];

  const handleStartNewChat = async () => {
    if (!persona?.id || isCreatingChat) return;

    setIsCreatingChat(true);
    try {
      const createdChat = await createChatAction(persona.id);
      await mutate("/api/chats");
      router.push(`/chats/${createdChat.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unexpected error";
      toast.error("Failed to start a new chat", {
        description: errorMessage,
      });
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = async () => {
    if (isDeletingChat) return;

    setIsDeletingChat(true);
    try {
      await deleteChatAction(chatId);
      await mutate("/api/chats");
      setIsDeleteDialogOpen(false);
      router.push("/chats");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unexpected error";
      toast.error("Failed to delete chat", {
        description: errorMessage,
      });
      setIsDeletingChat(false);
    }
  };

  return (
    <>
      <TopBar
        className={className}
        left={<TopBarSidebarTrigger />}
        center={
          <TopBarTitle>
            <HugeiconsIcon icon={Message02Icon} strokeWidth={1.5} />
            {persona.name}
          </TopBarTitle>
        }
        right={
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="More chat actions"
                title="More"
              >
                <HugeiconsIcon icon={Menu09Icon} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-52">
              <DropdownMenuItem
                disabled={isCreatingChat || !persona?.id}
                onSelect={(event) => {
                  event.preventDefault();
                  void handleStartNewChat();
                }}
              >
                <HugeiconsIcon
                  icon={isCreatingChat ? Loading02Icon : PlusSignIcon}
                  className={isCreatingChat ? "animate-spin" : ""}
                />
                Start new chat
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setSidebarOpen(!sidebarOpen);
                }}
              >
                <HugeiconsIcon icon={LayoutAlignRightIcon} />
                {sidebarOpen ? "Hide chat panel" : "Show chat panel"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={isDeletingChat}
                onSelect={(event) => {
                  event.preventDefault();
                  setIsDeleteDialogOpen(true);
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} />
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              You can&apos;t undo this action. All messages will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingChat}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteChat()}
              disabled={isDeletingChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingChat ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
