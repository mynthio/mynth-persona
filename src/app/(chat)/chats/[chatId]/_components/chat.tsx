"use client";

import { type FormEvent, useCallback, useMemo, useRef, useState } from "react";
import type { ScrollActions } from "../_hooks/use-chat-scroll.hook";
import dynamic from "next/dynamic";
import TextareaAutosize from "react-textarea-autosize";
import { nanoid } from "nanoid";
import { DefaultChatTransport } from "ai";
import { ArrowUp, StickerSquare } from "@untitledui/icons";
import { Drama, Square, X } from "lucide-react";
import {
  useChat,
  useChatActions,
  useChatId,
  useChatMessages,
  useChatStatus,
} from "@ai-sdk-tools/store";

import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import type { ChatMode } from "@/schemas/backend/chats/chat.schema";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";
import ChatMessages from "./chat-messages";

const ChatModelPickerMenu = dynamic(
  () =>
    import("./chat-model-picker-menu").then((mod) => ({
      default: mod.ChatModelPickerMenu,
    })),
  { ssr: false },
);

// ---------------------------------------------------------------------------
// Chat (root)
// ---------------------------------------------------------------------------

type ChatProps = {
  chat: { id: string; mode: ChatMode };
  initialMessages: PersonaUIMessage[];
};

export default function Chat({ chat, initialMessages }: ChatProps) {
  const { addMessageToBranch, setActiveId, isSwitchingBranch } =
    useChatBranchesContext();

  const messagesContainerRef = useRef<HTMLDivElement>(null!);
  const scrollActionsRef = useRef<ScrollActions>({
    scrollToLatestMessage: () => {},
  });

  // Stable transport — avoids re-creating the instance on every render
  const transport = useMemo(
    () =>
      new DefaultChatTransport<PersonaUIMessage>({
        api: `/api/chats/${chat.id}/chat`,
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: {
            ...body,
            parentId: messages.at(-2)?.id ?? null,
            message:
              body?.event === "edit_message"
                ? body?.editedMessage
                : messages.at(-1),
          },
        }),
      }),
    [chat.id],
  );

  // Stable callback — prevents useChat from re-subscribing each render
  const handleFinish = useCallback(
    ({ message }: { message: PersonaUIMessage }) => {
      setActiveId(message.id);
      addMessageToBranch(message.metadata?.parentId ?? null, {
        id: message.id,
        createdAt: new Date(),
      });
    },
    [setActiveId, addMessageToBranch],
  );

  const generateId = useCallback(() => `msg_${nanoid(32)}`, []);

  useChat({
    id: chat.id,
    messages: initialMessages,
    transport,
    onFinish: handleFinish,
    generateId,
  });

  return (
    <div className="w-full flex flex-col shrink-0 min-w-0 min-h-0 items-center px-[12px] md:px-0 relative z-0">
      <ChatMessages
        containerRef={messagesContainerRef}
        scrollActionsRef={scrollActionsRef}
      />
      {isSwitchingBranch ? <BranchSwitchingIndicator /> : null}
      <ChatPrompt scrollActionsRef={scrollActionsRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatPrompt
// ---------------------------------------------------------------------------

type ChatPromptProps = {
  scrollActionsRef: React.RefObject<ScrollActions>;
};

function ChatPrompt({ scrollActionsRef }: ChatPromptProps) {
  const [text, setText] = useState("");
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [authorNoteOpen, setAuthorNoteOpen] = useState(false);

  const chatId = useChatId();
  const { sendMessage, regenerate, stop } = useChatActions();
  const status = useChatStatus();
  const messages = useChatMessages();
  const { modelId, authorNote, setAuthorNote } = useChatMain();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derived state — computed during render, no effects needed
  const isStreaming = status === "streaming" || status === "submitted";
  const hasText = text.trim().length > 0;
  const authorNoteValue = authorNote ?? "";
  const authorNoteLength = authorNoteValue.length;
  const hasAuthorNote = authorNoteLength > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasText || (status !== "ready" && status !== "error")) return;

    if (status === "error") {
      regenerate({
        body: { event: "regenerate", modelId, authorNote },
      });
    }

    sendMessage(
      {
        text,
        metadata: { parentId: messages.at(-1)?.id ?? null },
      },
      {
        body: { event: "send", modelId, authorNote },
      },
    );

    scrollActionsRef.current.scrollToLatestMessage();
    setText("");
  };

  const handleImpersonate = async () => {
    if (isImpersonating) return;

    const parentId = messages.at(-1)?.id ?? null;
    setIsImpersonating(true);

    try {
      const response = await fetch(`/api/chats/${chatId}/impersonate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "send", parentId }),
      });

      if (!response.ok || !response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          setText((prev) => prev + chunk);
        }
      }
    } catch (error) {
      console.error("Impersonation request failed", error);
    } finally {
      setIsImpersonating(false);
    }
  };

  return (
    <div className="sticky bottom-0 w-full max-w-2xl z-10 mt-auto shrink-0 pb-5 pt-6">
      <form onSubmit={handleSubmit} className="relative w-full">
        {/* Main input container */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl transition-all duration-300 ease-out",
            "bg-card backdrop-blur-xl",
            "shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.06)]",
            "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.2),0_12px_32px_rgba(0,0,0,0.3)]",
            "ring-1 ring-border/40",
            isFocused &&
              "ring-border/60 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.08)]",
            isFocused &&
              "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.25),0_16px_40px_rgba(0,0,0,0.35)]",
          )}
        >
          {/* Textarea */}
          <TextareaAutosize
            ref={textareaRef}
            className={cn(
              "w-full resize-none bg-transparent",
              "px-4 pt-4 pb-2 text-[15px] leading-relaxed tracking-[-0.01em]",
              "placeholder:text-muted-foreground/40",
              "outline-none border-none focus:ring-0",
              "min-h-[56px] max-h-[200px]",
            )}
            placeholder="Write your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck
            autoCorrect="on"
            autoCapitalize="sentences"
            data-gramm="true"
            data-gramm_editor="true"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            {/* Left side - Model selector */}
            <ChatModelSelector />

            {/* Right side - Actions */}
            <div className="flex items-center gap-0.5">
              {/* Impersonate button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleImpersonate}
                    disabled={isImpersonating}
                    className={cn(
                      "size-8 rounded-xl text-muted-foreground/50 hover:text-foreground hover:bg-muted/60",
                      "transition-all duration-200",
                      isImpersonating && "text-primary animate-pulse",
                    )}
                  >
                    <Drama className="size-[18px]" />
                    <span className="sr-only">Impersonate User</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  <p>Impersonate User</p>
                  <p className="text-[10px] text-muted-foreground">
                    AI writes as you
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Author Note button */}
              <Popover open={authorNoteOpen} onOpenChange={setAuthorNoteOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Open author note"
                        className={cn(
                          "size-8 rounded-xl text-muted-foreground/50 hover:text-foreground hover:bg-muted/60",
                          "transition-all duration-200",
                          hasAuthorNote && "text-primary",
                        )}
                      >
                        <StickerSquare className="size-[18px]" />
                        <span className="sr-only">Author Note</span>
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    <p>Author Note</p>
                    <p className="text-[10px] text-muted-foreground">
                      Steer the AI temporarily
                    </p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent
                  align="end"
                  side="top"
                  sideOffset={12}
                  className="w-[min(26rem,calc(100vw-2rem))] rounded-xl p-4 shadow-xl"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Author Note
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="size-6 rounded-lg text-muted-foreground/60 hover:text-foreground"
                      onClick={() => setAuthorNoteOpen(false)}
                    >
                      <X className="size-3.5" />
                      <span className="sr-only">Close author note</span>
                    </Button>
                  </div>
                  <textarea
                    className={cn(
                      "w-full resize-none rounded-lg border-0 bg-muted/50",
                      "px-3.5 py-3 text-sm leading-relaxed",
                      "placeholder:text-muted-foreground/40",
                      "outline-none ring-1 ring-border/40 focus:ring-border",
                      "min-h-[100px] max-h-[180px]",
                      "transition-shadow duration-200",
                    )}
                    placeholder="E.g. Make the character more flirty, introduce a plot twist..."
                    value={authorNoteValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAuthorNote(value.trim().length === 0 ? null : value);
                    }}
                    maxLength={500}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground/60">
                      Sent with every message until cleared
                    </p>
                    <span className="text-[11px] text-muted-foreground/50 tabular-nums">
                      {authorNoteLength}/500
                    </span>
                  </div>
                  {hasAuthorNote ? (
                    <div className="mt-3 flex justify-start border-t border-border/40 pt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => setAuthorNote(null)}
                      >
                        Clear note
                      </Button>
                    </div>
                  ) : null}
                </PopoverContent>
              </Popover>

              {/* Divider */}
              <div className="mx-1.5 h-5 w-px bg-border/40" />

              {/* Send / Stop button */}
              {isStreaming ? (
                <Button
                  type="button"
                  onClick={stop}
                  size="icon-sm"
                  className={cn(
                    "size-8 rounded-xl transition-all duration-200",
                    "bg-destructive/10 text-destructive hover:bg-destructive/20",
                  )}
                >
                  <Square className="size-3.5 fill-current" />
                  <span className="sr-only">Stop generation</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon-sm"
                  disabled={!hasText}
                  className={cn(
                    "size-8 rounded-xl transition-all duration-200",
                    hasText
                      ? "bg-foreground text-background hover:bg-foreground/90 scale-100"
                      : "bg-muted text-muted-foreground/30 cursor-not-allowed scale-95",
                  )}
                >
                  <ArrowUp className="size-4" strokeWidth={2.5} />
                  <span className="sr-only">Send message</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground/30 select-none">
          <kbd className="font-mono text-[10px]">Enter</kbd>
          <span className="mx-1">to send</span>
          <span className="mx-1">·</span>
          <kbd className="font-mono text-[10px]">Shift + Enter</kbd>
          <span className="mx-1">for new line</span>
        </p>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatModelSelector
// ---------------------------------------------------------------------------

function ChatModelSelector() {
  const { navigateSettings } = useSettingsNavigation();
  const { modelId, setModelId } = useChatMain();

  const handleModelChange = (selectedModelId: TextGenerationModelId) => {
    if (modelId === selectedModelId) return;
    setModelId(selectedModelId);
  };

  return (
    <div className="flex items-center">
      <ChatModelPickerMenu
        currentModelId={modelId!}
        onModelChange={handleModelChange}
        onOpenSettings={() => navigateSettings("model")}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// BranchSwitchingIndicator
// ---------------------------------------------------------------------------

function BranchSwitchingIndicator() {
  return (
    <div className="sticky bottom-20 z-20 flex justify-center pointer-events-none">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm">
        <Spinner className="size-4" />
        <span className="text-sm text-muted-foreground">
          Loading branch...
        </span>
      </div>
    </div>
  );
}
