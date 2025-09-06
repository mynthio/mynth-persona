"use client";

import {
  PromptInput,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { useChatId } from "@/hooks/use-chat-id.hook";
import { createChat } from "@/actions/create-chat.action";
import { useSWRConfig } from "swr";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  ChatProvider,
  useChatContext,
} from "@/app/(chat)/_contexts/chat.context";
import {
  ChatBranchesProvider,
  useChatBranchesContext,
} from "@/app/(chat)/_contexts/chat-branches.context";
import { ChatMessage } from "./chat-message";
import { ChatConversation } from "./chat-conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
  CircleNotchIcon,
  PaperPlaneTiltIcon,
  CoinsIcon,
} from "@phosphor-icons/react/dist/ssr";
import { usePrevious } from "@uidotdev/usehooks";
import dynamic from "next/dynamic";
// new imports for model selector
import { chatConfig } from "@/config/shared/chat/chat-models.config";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import { ChatInitiation } from "./chat-initiation";
import { cn } from "@/lib/utils";
import { ChatStatus } from "ai";
import { useChatQuery } from "@/app/_queries/use-chat.query";

// Resolve default model and model options for selection
const DEFAULT_MODEL_ID: TextGenerationModelId | undefined =
  chatConfig.models[0]?.modelId;

const ChatImageModal = dynamic(() => import("./chat-image-modal"), {
  ssr: false,
});
const ChatBranchPreviewsDialog = dynamic(
  () => import("./chat-branch-previews-dialog"),
  { ssr: false }
);

function Chat() {
  const [chatId, setChatId] = useChatId();

  return (
    <ChatProvider chatId={chatId ?? undefined}>
      <ChatBranchesProvider chatId={chatId}>
        <ChatImageModal />
        <ChatBranchPreviewsDialog />
        <ChatInner />
      </ChatBranchesProvider>
    </ChatProvider>
  );
}

export function ChatInner() {
  const swrConfig = useSWRConfig();
  const [chatId, setChatId] = useChatId();
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingBranch, setIsLoadingBranch] = useState(false);
  const [personaId] = usePersonaId();
  // Branch selection is handled by ChatBranchesContext (with its own localStorage persistence)

  const previousChatId = usePrevious(chatId);
  const { chat } = useChatContext();
  const { messages, setMessages, sendMessage, status } = useChat({
    chat,
  });

  const branchesCtx = useChatBranchesContext();

  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"roleplay" | "story">(
    "roleplay"
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    DEFAULT_MODEL_ID ?? ""
  );

  const [input, setInput] = useState("");

  // Fetch chat detail to know which model is configured for this chat (if any)
  const { data: chatDetail } = useChatQuery(chatId);

  // Build a fast lookup map for model -> cost once
  const MODEL_COST_MAP = useMemo(() => {
    return chatConfig.models.reduce<Record<string, number>>((acc, m) => {
      acc[m.modelId] = m.cost;
      return acc;
    }, {});
  }, []);

  // Resolve the current model id: prefer chat settings when chat exists, otherwise use the pre-chat selection
  const currentModelId = useMemo(() => {
    const idFromChat = chatDetail?.settings?.model as string | undefined;
    return (chatId && idFromChat ? idFromChat : selectedModel) || "";
  }, [chatId, chatDetail?.settings?.model, selectedModel]);

  // Resolve cost for the current model (undefined if not found)
  const currentModelCost = useMemo(() => {
    return currentModelId ? MODEL_COST_MAP[currentModelId] : undefined;
  }, [MODEL_COST_MAP, currentModelId]);

  useEffect(() => {
    if (!branchesCtx.branchId) return;

    const abortController = new AbortController();
    setIsLoadingBranch(true);

    fetch(
      `/api/chats/${chatId}/messages${
        branchesCtx.branchId ? `?messageId=${branchesCtx.branchId}` : ""
      }`,
      { signal: abortController.signal }
    )
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch messages");
        return r.json();
      })
      .then((data) => {
        // Only update state if the request wasn't aborted
        if (!abortController.signal.aborted) {
          setMessages(data.messages);
        }
      })
      .catch((error) => {
        // Ignore abort errors as they're expected when switching
        if (error.name !== "AbortError") {
          console.error("Error fetching messages:", error);
        }
      })
      .finally(() => {
        // Only update loading state if the request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsLoadingBranch(false);
        }
      });

    // Cleanup function to abort the request when dependencies change
    return () => {
      abortController.abort();
    };
  }, [branchesCtx.branchId]);

  useEffect(() => {
    if (!chatId) return;

    const abortController = new AbortController();
    setIsLoadingChat(true);

    fetch(
      `/api/chats/${chatId}/messages${
        branchesCtx.branchId ? `?messageId=${branchesCtx.branchId}` : ""
      }`,
      { signal: abortController.signal }
    )
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch messages");
        return r.json();
      })
      .then((data) => {
        // Only update state if the request wasn't aborted
        if (!abortController.signal.aborted) {
          setMessages(data.messages);
        }
      })
      .catch((error) => {
        // Ignore abort errors as they're expected when switching
        if (error.name !== "AbortError") {
          console.error("Error fetching messages:", error);
        }
      })
      .finally(() => {
        // Only update loading state if the request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsLoadingChat(false);
        }
      });

    // Cleanup function to abort the request when dependencies change
    return () => {
      abortController.abort();
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    const abortController = new AbortController();
    setIsLoadingChat(true);

    fetch(
      `/api/chats/${chatId}/messages${
        branchesCtx.branchId ? `?messageId=${branchesCtx.branchId}` : ""
      }`,
      { signal: abortController.signal }
    )
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch messages");
        return r.json();
      })
      .then((data) => {
        // Only update state if the request wasn't aborted
        if (!abortController.signal.aborted) {
          setMessages(data.messages);
        }
      })
      .catch((error) => {
        // Ignore abort errors as they're expected when switching
        if (error.name !== "AbortError") {
          console.error("Error fetching messages:", error);
        }
      })
      .finally(() => {
        // Only update loading state if the request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsLoadingChat(false);
        }
      });

    // Cleanup function to abort the request when dependencies change
    return () => {
      abortController.abort();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let newChatId: string | undefined = undefined;

    if (!chatId) {
      setMessages([]);
      setIsCreatingChat(true);
      const response = await createChat(
        personaId!,
        input,
        selectedMode,
        selectedModel || undefined
      );

      swrConfig.mutate(`/api/personas/${personaId}/chats`);
      swrConfig.mutate(
        `/api/chats/${response.id}/messages`,
        [
          {
            role: "user",
            parts: {
              type: "text",
              text: input,
            },
          },
        ],
        {
          revalidate: false,
        }
      );
      // Do not seed React Query cache with an empty messages array; it can wipe Chat SDK state
      setChatId(response.id);
      newChatId = response.id;
      setIsCreatingChat(false);
    }

    if (input.trim()) {
      sendMessage(
        { text: input },
        {
          body: {
            chatId: newChatId || chatId,
          },
        }
      );
      setInput("");
    }
  };

  if (isLoadingChat) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <CircleNotchIcon size={24} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 justify-between gap-4">
      {/* Show ChatInitiation component when there's no chatId and no messages */}
      {!chatId ? (
        <ChatInitiation
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />
      ) : (
        <ChatConversation>
          {/* Render from Chat SDK state when streaming; otherwise show branch-aware messages */}
          {messages.map((message: PersonaUIMessage) => (
            <ChatMessage key={message.id} message={message} status={status} />
          ))}
          {chat.status === "submitted" && <Loader />}
        </ChatConversation>
      )}

      <PromptInput
        onSubmit={handleSubmit}
        className="w-full max-w-2xl mx-auto sticky bottom-4 p-2 bg-gradient-to-t from-zinc-50/80 to-white/70 backdrop-blur-lg border-zinc-200 shadow-lg shadow-zinc-100/50"
      >
        <PromptInputTextarea
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
        <div className="flex items-center justify-between p-1">
          {/* Cost note (optimized with memoized lookups) */}
          {currentModelId ? (
            <div className="pl-2 text-[11px] text-zinc-600 inline-flex items-center gap-1.5">
              <CoinsIcon className="size-3.5" />
              {currentModelCost === 0
                ? "free per message"
                : typeof currentModelCost === "number"
                ? `${currentModelCost} per message`
                : "cost unknown"}
            </div>
          ) : (
            <div className="pl-2 text-[11px] text-zinc-500">
              Select a model to see cost
            </div>
          )}
          <PromptSubmitButton
            isLoading={
              status === "submitted" || status === "streaming" || isCreatingChat
            }
            disabled={!input.trim() || isCreatingChat}
          />
        </div>
      </PromptInput>
    </div>
  );
}

function PromptSubmitButton({
  isLoading,
  disabled,
}: {
  children?: ReactNode;
  isLoading: boolean;
  disabled: boolean;
}) {
  const Icon = useMemo(() => {
    if (isLoading) {
      return <CircleNotchIcon size={18} className="animate-spin" />;
    }

    return <PaperPlaneTiltIcon size={18} />;
  }, [isLoading]);

  const isDisabled = useMemo(
    () => disabled || isLoading,
    [disabled, isLoading]
  );

  return (
    <button
      disabled={isDisabled}
      className={cn(
        "size-10 shadow-none",
        "transition duration-250 hover:scale-110",
        "flex items-center justify-center gap-3 rounded-md",
        "bg-gradient-to-tr from-zinc-100 to-zinc-100/70 hover:to-zinc-100/80",
        "text-sm text-zinc-600",
        "border-none outline-none"
      )}
      type="submit"
    >
      {Icon}
    </button>
  );
}

export default Chat;
