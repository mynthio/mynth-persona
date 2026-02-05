"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { deleteChatAction } from "@/actions/delete-chat.action";
import { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";
import { useChatMain } from "../_contexts/chat-main.context";

export function DeleteChat() {
  const { chatId } = useChatMain();
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteChatAction(chatId);
      // Revalidate chats list for SWR consumers
      await mutate("/api/chats");
      // Redirect to chats list
      router.push("/chats");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="shrink-0" variant="outline">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="-mt-8 w-96 max-w-[calc(100vw-3rem)] rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-gray-200 dark:outline-gray-300">
        <AlertDialogTitle className="-mt-1.5 mb-1 text-lg font-onest font-medium">
          Delete chat?
        </AlertDialogTitle>
        <AlertDialogDescription className="mb-6 text-base text-gray-600">
          You can’t undo this action.
        </AlertDialogDescription>
        <AlertDialogFooter className="gap-4 sm:gap-4">
          <AlertDialogCancel asChild>
            <Button>Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild onClick={handleConfirm}>
            <Button variant="outline" disabled={isDeleting}>
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
