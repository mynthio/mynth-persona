"use client";

import { useCallback, useTransition } from "react";
import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { useChatActions, useChatStoreApi } from "../_store/hooks";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  PencilEdit02Icon,
  Delete02Icon,
  Image02Icon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteMessageAction } from "@/actions/delete-message.action";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { useChatMain } from "../_contexts/chat-main.context";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useSwitchBranch } from "../_hooks/use-switch-branch.hook";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";
import { toast } from "sonner";
import { ImageGenerationMenuItems } from "./chat-message-generate-image-button";

type ChatMessageMenuContentProps = {
  message: PersonaUIMessage;
};

export function UserMessageMenuContent(props: ChatMessageMenuContentProps) {
  const [, copyToClipboard] = useCopyToClipboard();
  const { setEditMessageId } = useChatMain();

  const handleCopy = useCallback(() => {
    copyToClipboard(
      props.message.parts
        ?.map((p) => (p.type === "text" ? p.text : ""))
        .join(""),
    );
  }, [copyToClipboard, props.message.parts]);

  return (
    <>
      <DropdownMenuItem onClick={handleCopy}>
        <HugeiconsIcon icon={Copy01Icon} size={16} />
        Copy message
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setEditMessageId(props.message.id)}>
        <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
        Edit message
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DeleteMessageMenuItem messageId={props.message.id} />
    </>
  );
}

export function AssistantMessageMenuContent(
  props: ChatMessageMenuContentProps,
) {
  const [, copyToClipboard] = useCopyToClipboard();
  const { setEditMessageId } = useChatMain();

  const handleCopy = useCallback(() => {
    copyToClipboard(
      props.message.parts
        ?.map((p) => (p.type === "text" ? p.text : ""))
        .join(""),
    );
  }, [copyToClipboard, props.message.parts]);

  return (
    <>
      <DropdownMenuItem onClick={handleCopy}>
        <HugeiconsIcon icon={Copy01Icon} size={16} />
        Copy message
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setEditMessageId(props.message.id)}>
        <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
        Edit message
      </DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <HugeiconsIcon icon={Image02Icon} size={16} />
          Generate image
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-56">
          <ImageGenerationMenuItems messageId={props.message.id} />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DeleteMessageMenuItem messageId={props.message.id} />
    </>
  );
}

type DeleteMessageMenuItemProps = {
  messageId: string;
};

function DeleteMessageMenuItem(props: DeleteMessageMenuItemProps) {
  const { setMessages } = useChatActions();
  const storeApi = useChatStoreApi();
  const { branchId, branches, removeMessageFromBranch } =
    useChatBranchesContext();
  const switchBranch = useSwitchBranch();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        // Read messages before deletion to find parentId and check thread membership
        const messages = storeApi.getState().messages;
        const deletedMsg = messages.find((m) => m.id === props.messageId);
        const parentId = deletedMsg?.metadata?.parentId ?? null;

        // Check if the deleted message is in the current thread
        // (i.e. it's the active branchId or an ancestor of it)
        const messageIds = new Set(messages.map((m) => m.id));
        const isInCurrentThread = messageIds.has(props.messageId);

        await deleteMessageAction(props.messageId);

        // Update branch state
        removeMessageFromBranch(parentId, props.messageId);

        if (!isInCurrentThread || props.messageId !== branchId) {
          // Not in the current thread or not the active leaf — just filter locally
          const childrenByParent = new Map<string, string[]>();
          for (const msg of messages) {
            const pid = msg.metadata?.parentId;
            if (pid) {
              const siblings = childrenByParent.get(pid);
              if (siblings) siblings.push(msg.id);
              else childrenByParent.set(pid, [msg.id]);
            }
          }

          const messageIdsToRemove = new Set<string>();
          const stack = [props.messageId];
          while (stack.length > 0) {
            const id = stack.pop()!;
            messageIdsToRemove.add(id);
            const children = childrenByParent.get(id);
            if (children) stack.push(...children);
          }

          setMessages(
            messages.filter((msg) => !messageIdsToRemove.has(msg.id)),
          );
        } else {
          // Deleted message IS the active branch — need to switch
          const parentKey = parentId ?? ROOT_BRANCH_PARENT_ID;
          const siblings = branches[parentKey]?.filter(
            (s) => s.id !== props.messageId,
          );

          if (siblings && siblings.length > 0) {
            // Switch to next sibling (or previous if deleted was last)
            const originalBranch = branches[parentKey] ?? [];
            const deletedIdx = originalBranch.findIndex(
              (m) => m.id === props.messageId,
            );
            const targetIdx = Math.min(deletedIdx, siblings.length - 1);
            await switchBranch(siblings[targetIdx].id, { parentId });
          } else if (parentId) {
            // No siblings — switch to parent thread
            await switchBranch(parentId, { parentId });
          } else {
            // No siblings, no parent — fetch latest thread or empty chat
            await switchBranch(null);
          }
        }

        toast.success("Message deleted");
      } catch (error) {
        console.error("Failed to delete message:", error);
        toast.error("Failed to delete message");
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          disabled={isPending}
        >
          <HugeiconsIcon icon={Delete02Icon} size={16} />
          Delete message
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete message?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this message and all reply branches
            that follow from it. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
