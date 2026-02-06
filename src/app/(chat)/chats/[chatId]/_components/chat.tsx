"use client";

import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  useChat,
  useChatActions,
  useChatId,
  useChatMessages,
  useChatStatus,
} from "@ai-sdk-tools/store";
import { DefaultChatTransport } from "ai";

import { FormEvent, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { Spinner } from "@/components/ui/spinner";
import TextareaAutosize from "react-textarea-autosize";
import { ChatMode } from "@/schemas/backend/chats/chat.schema";
import { nanoid } from "nanoid";
import ChatMessages from "./chat-messages";
import { useChatMain } from "../_contexts/chat-main.context";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import { cn } from "@/lib/utils";

const ChatModelPickerMenu = dynamic(
  () =>
    import("./chat-model-picker-menu").then((mod) => ({
      default: mod.ChatModelPickerMenu,
    })),
  { ssr: false },
);
import { ArrowUp, StickerSquare } from "@untitledui/icons";
import { Drama, Square, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ChatProps = {
  chat: { id: string; mode: ChatMode };
  initialMessages: PersonaUIMessage[];
};

export default function Chat(props: ChatProps) {
  const { addMessageToBranch, setActiveId, isSwitchingBranch } =
    useChatBranchesContext();
  // Use non-null assertion for ref type to satisfy downstream component prop types
  const messagesContainerRef = useRef<HTMLDivElement>(null!);
  const shouldScrollRef = useRef(false);
  const setShouldScroll = (value: boolean) => {
    shouldScrollRef.current = value;
  };

  useChat({
    id: props.chat.id,

    messages: props.initialMessages,

    transport: new DefaultChatTransport<PersonaUIMessage>({
      api: `/api/chats/${props.chat.id}/chat`,

      prepareSendMessagesRequest: ({ messages, body }) => {
        return {
          body: {
            ...body,
            parentId: messages.at(-2)?.id ?? null,
            message:
              body?.event === "edit_message"
                ? body?.editedMessage
                : messages.at(-1),
          },
        };
      },
    }),

    onFinish: ({ message }) => {
      setActiveId(message.id);
      addMessageToBranch(message.metadata?.parentId ?? null, {
        id: message.id,
        createdAt: new Date(),
      });
    },

    generateId: () => `msg_${nanoid(32)}`,
  });

  return (
    <div className="w-full flex flex-col shrink-0 min-w-0 min-h-0 items-center px-[12px] md:px-0 relative z-0">
      <ChatMessages
        containerRef={messagesContainerRef}
        shouldScrollRef={shouldScrollRef}
      />
      {isSwitchingBranch && <BranchSwitchingIndicator />}
      <ChatPrompt
        messagesContainerRef={messagesContainerRef}
        shouldScrollRef={shouldScrollRef}
        setShouldScroll={setShouldScroll}
      />
    </div>
  );
}

type ChatPromptProps = {
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  shouldScrollRef: React.MutableRefObject<boolean>;
  setShouldScroll: (value: boolean) => void;
};

function ChatPrompt(props: ChatPromptProps) {
  const [text, setText] = useState<string>("");
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const chatId = useChatId();
  const { sendMessage, regenerate, stop } = useChatActions();
  const status = useChatStatus();
  const messages = useChatMessages();
  const { modelId, authorNote, setAuthorNote } = useChatMain();

  const [authorNoteOpen, setAuthorNoteOpen] = useState(false);
  const authorNoteValue = authorNote ?? "";
  const authorNoteLength = authorNoteValue.length;
  const hasAuthorNote = authorNoteLength > 0;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";
  const hasText = text.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasText) {
      return;
    }

    if (status !== "ready") {
      if (status === "error") {
        regenerate({
          body: {
            event: "regenerate",
            modelId,
            authorNote,
          },
        });
      } else {
        return;
      }
    }

    // Set flag to trigger scroll after message is added
    props.setShouldScroll(true);

    sendMessage(
      {
        text,
        metadata: {
          parentId: messages.at(-1)?.id ?? null,
        },
      },
      {
        body: {
          event: "send",
          modelId,
          authorNote,
        },
      },
    );

    // Clear input field
    setText("");
    event.currentTarget.reset();
  };

  const handleImpersonate = async () => {
    if (isImpersonating) return;

    const parentId = messages.at(-1)?.id ?? null;
    setIsImpersonating(true);

    try {
      const response = await fetch(`/api/chats/${chatId}/impersonate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "send",
          parentId,
        }),
      });

      if (!response.ok || !response.body) {
        return;
      }

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
    <div className="sticky bottom-0 w-full max-w-2xl z-10 mt-auto shrink-0 pb-4 pt-4">
      <form onSubmit={handleSubmit} className="relative w-full">
        {/* Main input container */}
        <div
          className={cn(
            "overflow-hidden rounded-xl transition-colors duration-200",
            "bg-muted/40",
            "border border-border/50",
            isFocused && "border-border",
          )}
        >
          {/* Textarea */}
          <TextareaAutosize
            ref={textareaRef}
            className={cn(
              "w-full resize-none bg-transparent",
              "px-4 pt-3.5 pb-1.5 text-sm leading-relaxed",
              "placeholder:text-muted-foreground/50",
              "outline-none border-none focus:ring-0",
              "min-h-[52px] max-h-[200px]",
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
          <div className="flex items-center justify-between px-2.5 pb-2.5 pt-0.5">
            {/* Left side - Model selector */}
            <ChatModelSelector />

            {/* Right side - Actions */}
            <div className="flex items-center gap-1">
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
                      "rounded-lg text-muted-foreground/60 hover:text-foreground",
                      isImpersonating && "text-primary animate-pulse",
                    )}
                  >
                    <Drama className="size-4" />
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
                          "rounded-lg text-muted-foreground/60 hover:text-foreground",
                          hasAuthorNote && "text-primary",
                        )}
                      >
                        <StickerSquare className="size-4" />
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
                  sideOffset={8}
                  className="w-[min(30rem,calc(100vw-2rem))] p-3.5"
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Author Note
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground/80 hover:text-foreground"
                      onClick={() => setAuthorNoteOpen(false)}
                    >
                      <X className="size-3.5" />
                      <span className="sr-only">Close author note</span>
                    </Button>
                  </div>
                  <textarea
                    className={cn(
                      "w-full resize-none rounded-md border border-border/60 bg-muted/30",
                      "px-3 py-2.5 text-sm leading-relaxed",
                      "placeholder:text-muted-foreground/50",
                      "outline-none focus:border-border focus:ring-1 focus:ring-ring",
                      "min-h-[88px] max-h-[180px]",
                    )}
                    placeholder="E.g. Make the character more flirty, introduce a plot twist..."
                    value={authorNoteValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAuthorNote(value.trim().length === 0 ? null : value);
                    }}
                    maxLength={500}
                  />
                  <div className="mt-2.5 flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground/70">
                      Sent with every message until cleared
                    </p>
                    <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                      {authorNoteLength}/500
                    </span>
                  </div>
                  <div className="mt-2 flex justify-start">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                      disabled={!hasAuthorNote}
                      onClick={() => setAuthorNote(null)}
                    >
                      Clear note
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Send / Stop button */}
              {isStreaming ? (
                <Button
                  type="button"
                  onClick={stop}
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Square className="size-4 fill-current" />
                  <span className="sr-only">Stop generation</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon-sm"
                  disabled={!hasText}
                  className={cn(
                    "rounded-lg transition-colors",
                    hasText
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-transparent text-muted-foreground/30 cursor-not-allowed",
                  )}
                >
                  <ArrowUp className="size-4" strokeWidth={2} />
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

function BranchSwitchingIndicator() {
  return (
    <div className="sticky bottom-20 z-20 flex justify-center pointer-events-none">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm">
        <Spinner className="size-4" />
        <span className="text-sm text-muted-foreground">Loading branch...</span>
      </div>
    </div>
  );
}
