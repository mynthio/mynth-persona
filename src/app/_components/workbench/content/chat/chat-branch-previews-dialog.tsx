"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Response } from "@/components/ai-elements/response";
import { useChatBranchId } from "@/hooks/use-chat-branch-id.hook";
import { useChatId } from "@/hooks/use-chat-id.hook";
import { useChatBranchQuery } from "@/app/_queries/use-chat-branch.query";
import { useChatBranchesContext } from "@/app/(chat)/_contexts/chat-branches.context";

export default function ChatBranchPreviewsDialog() {
  const [branchId, setBranchId] = useChatBranchId();
  const [chatId] = useChatId();
  const open = Boolean(branchId);
  const { setActiveId } = useChatBranchesContext();

  const {
    data: previews,
    isLoading,
    error,
  } = useChatBranchQuery(chatId, branchId);

  const handleClose = () => setBranchId(null);

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : handleClose())}>
      <DialogContent className="w-full max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Branch preview</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading previews…</div>
        ) : error ? (
          <div className="text-sm text-destructive">
            Failed to load branch previews.
          </div>
        ) : !previews || previews.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No previews available for this branch.
          </div>
        ) : (
          <ScrollArea className="h-[min(70vh,720px)] px-2 pb-4">
            <ul className="space-y-2">
              {previews.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(m.id);
                      handleClose();
                    }}
                    className="w-full text-left p-3 bg-accent/50 rounded-xl hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="shrink-0 mt-0.5 h-2 w-2 rounded-full bg-primary/70"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          {m.role} •{" "}
                          {new Date(m.createdAt as any).toLocaleString()}
                        </div>
                        <Response>{m.preview}</Response>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
