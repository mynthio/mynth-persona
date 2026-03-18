"use client";

import {
  Copy01Icon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
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
import { cloneChatAction } from "@/actions/clone-chat.action";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

export function ChatTopBar({ className }: { className?: string }) {
  const { sidebarOpen, setSidebarOpen, chatId, title } = useChatMain();
  const { personas } = useChatPersonas();
  const { branchId } = useChatBranchesContext();
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [isCloningChat, setIsCloningChat] = useState(false);
  const [cloneTitle, setCloneTitle] = useState("");
  const [cloneActiveBranchOnly, setCloneActiveBranchOnly] = useState(true);

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

  const handleOpenCloneDialog = () => {
    setCloneTitle(`${title} (Copy)`);
    setCloneActiveBranchOnly(true);
    setIsCloneDialogOpen(true);
  };

  const handleCloneChat = async () => {
    if (isCloningChat) return;

    setIsCloningChat(true);
    try {
      const result = await cloneChatAction({
        chatId,
        title: cloneTitle,
        activeBranchOnly: cloneActiveBranchOnly,
        leafId: branchId,
      });
      await mutate("/api/chats");
      setIsCloneDialogOpen(false);
      router.push(`/chats/${result.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unexpected error";
      toast.error("Failed to clone chat", {
        description: errorMessage,
      });
    } finally {
      setIsCloningChat(false);
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={sidebarOpen ? "Hide chat panel" : "Show chat panel"}
              title={sidebarOpen ? "Hide chat panel" : "Show chat panel"}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <HugeiconsIcon icon={LayoutAlignRightIcon} />
            </Button>

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

                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    handleOpenCloneDialog();
                  }}
                >
                  <HugeiconsIcon icon={Copy01Icon} />
                  Clone chat
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
          </div>
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

      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone chat</DialogTitle>
            <DialogDescription>
              Create a copy of this chat with all settings and personas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="clone-title">Title</Label>
              <Input
                id="clone-title"
                value={cloneTitle}
                onChange={(e) => setCloneTitle(e.target.value)}
                placeholder="Chat title"
              />
            </div>

            <Label className="flex items-center gap-2">
              <Checkbox
                checked={cloneActiveBranchOnly}
                onCheckedChange={(checked) =>
                  setCloneActiveBranchOnly(checked === true)
                }
              />
              Clone only active branch
            </Label>
            <p className="text-sm text-muted-foreground -mt-2">
              When checked, only the current conversation thread is copied.
              Uncheck to include all branches.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCloneDialogOpen(false)}
              disabled={isCloningChat}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCloneChat()}
              disabled={isCloningChat}
            >
              {isCloningChat ? "Cloning..." : "Clone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
