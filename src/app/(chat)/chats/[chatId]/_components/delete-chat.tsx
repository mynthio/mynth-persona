"use client";

import { AlertDialog } from "@base-ui-components/react/alert-dialog";
import { Button } from "@/components/mynth-ui/base/button";
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
    <AlertDialog.Root>
      <AlertDialog.Trigger
        render={
          <Button className="shrink-0" color="red" variant="outline">
            Delete
          </Button>
        }
      />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-background/20 z-overlay transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-dialog -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-1 outline-gray-200 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:outline-gray-300">
          <AlertDialog.Title className="-mt-1.5 mb-1 text-lg font-onest font-[500]">
            Delete chat?
          </AlertDialog.Title>
          <AlertDialog.Description className="mb-6 text-base text-gray-600">
            You can’t undo this action.
          </AlertDialog.Description>
          <div className="flex justify-end gap-4">
            <AlertDialog.Close render={<Button />}>Cancel</AlertDialog.Close>
            <AlertDialog.Close
              onClick={handleConfirm}
              render={<Button color="red" variant="outline" />}
              aria-disabled={isDeleting}
            >
              Delete
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
