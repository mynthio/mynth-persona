"use client";

import * as React from "react";
import { Toast } from "@base-ui-components/react/toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import ms from "ms";

function ToastProvider({
  children,
  limit = 3,
  timeout = ms("4s"),
}: {
  children: React.ReactNode;
  limit?: number;
  timeout?: number;
}) {
  return (
    <Toast.Provider limit={limit} timeout={timeout}>
      {children}
      <Toast.Portal>
        <Toast.Viewport
          className={cn(
            "fixed bottom-4 left-auto right-auto inset-x-0 mx-auto z-[100] flex w-[420px] max-w-[calc(100vw-2rem)] flex-col gap-2",
            "[&_[data-slot=toast]]:pointer-events-auto"
          )}
        >
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((t) => (
    <Toast.Root
      key={t.id}
      toast={t}
      swipeDirection={["right", "up"]}
      className={cn(
        "data-[starting-style]:opacity-0 data-[starting-style]:translate-y-[-6px]",
        "data-[ending-style]:opacity-0 data-[ending-style]:translate-y-[-6px]",
        "transition-all duration-200",
        "pointer-events-auto rounded-md border bg-surface-100 text-foreground shadow-lg",
        "grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3",
        // Type styles
        "data-[type=success]:border-green-300/60 data-[type=success]:bg-green-50 dark:data-[type=success]:bg-green-950/40",
        "data-[type=error]:border-red-300/60 data-[type=error]:bg-red-50 dark:data-[type=error]:bg-red-950/40",
        "data-[type=info]:border-blue-300/60 data-[type=info]:bg-blue-50 dark:data-[type=info]:bg-blue-950/40",
        "data-[type=loading]:opacity-90"
      )}
    >
      <Toast.Title className="text-sm font-medium leading-none" />
      <Toast.Close
        aria-label="Close"
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-md border",
          "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <X className="size-4" />
      </Toast.Close>
      <Toast.Description className="col-span-2 text-sm text-muted-foreground" />
    </Toast.Root>
  ));
}

function useToast() {
  return {} as any;
}

export { ToastProvider, useToast };
