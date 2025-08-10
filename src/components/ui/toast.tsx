"use client";

import * as React from "react";
import { Toast } from "@base-ui-components/react/toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Create a global manager so we can trigger toasts from anywhere in client components
export const toastManager = Toast.createToastManager();

type BaseToastOptions = {
  title?: string;
  description?: string;
  timeout?: number;
  // Match a simple set of types for styling; free-form string still supported
  type?: "success" | "error" | "info" | "loading" | (string & {});
};

export const toast = {
  add(options: BaseToastOptions) {
    return toastManager.add(options);
  },
  success(options: Omit<BaseToastOptions, "type">) {
    return toastManager.add({ ...options, type: "success" });
  },
  error(options: Omit<BaseToastOptions, "type">) {
    return toastManager.add({ ...options, type: "error" });
  },
  info(options: Omit<BaseToastOptions, "type">) {
    return toastManager.add({ ...options, type: "info" });
  },
  loading(options: Omit<BaseToastOptions, "type">) {
    return toastManager.add({ ...options, type: "loading", timeout: 0 });
  },
  update: toastManager.update,
  close: toastManager.close,
  promise: toastManager.promise,
};

export function AppToastProvider({
  children,
  limit = 3,
  timeout = 5000,
}: {
  children: React.ReactNode;
  limit?: number;
  timeout?: number;
}) {
  return (
    <Toast.Provider toastManager={toastManager} limit={limit} timeout={timeout}>
      <Toast.Portal>
        <Toast.Viewport
          className={cn(
            "fixed top-4 right-4 z-[100] flex w-[420px] max-w-[calc(100vw-2rem)] flex-col gap-2",
            "[&_[data-slot=toast]]:pointer-events-auto"
          )}
        >
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
      {children}
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
        "pointer-events-auto rounded-md border bg-background text-foreground shadow-lg",
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

export type ToastManager = typeof toastManager;
