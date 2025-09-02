import { useChatBranchesContext } from "@/app/(chat)/_contexts/chat-branches.context";
import { useChatContext } from "@/app/(chat)/_contexts/chat.context";
import { Action, Actions } from "@/components/ai-elements/actions";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { MiniWaveLoader } from "@/components/ui/mini-wave-loader";

import { useChatId } from "@/hooks/use-chat-id.hook";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard.hook";
import { getImageUrl } from "@/lib/utils";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { useChat } from "@ai-sdk/react";
import {
  ArrowsClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CircleNotchIcon,
  CopyIcon,
  CheckIcon,
  BrainIcon,
  PencilLineIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRun } from "@trigger.dev/react-hooks";
import ms from "ms";
import { useMemo, useState } from "react";
import { useChatMessageId } from "@/hooks/use-chat-message-id.hook";
import { useChatBranchId } from "@/hooks/use-chat-branch-id.hook";
import { useEditMessage } from "@/hooks/use-edit-message.hook";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { ChatStatus } from "ai";
import { TextareaAutosize } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";
import { nanoid } from "nanoid";

type ChatMessageProps = {
  message: PersonaUIMessage;
  status: ChatStatus;
};

type ChatMessageContentProps = {
  message: PersonaUIMessage;
};

function ChatMessageContent({ message }: ChatMessageContentProps) {
  const [, setChatMessageId] = useChatMessageId();

  return (
    <>
      {message.parts.map((part, i) => {
        switch (part.type) {
          case "text": // we don't use any reasoning or tool calls in this example
            return <Response key={`${message.id}-${i}`}>{part.text}</Response>;
          case "reasoning":
            return (
              <Reasoning
                defaultOpen={false}
                key={`${message.id}-${i}`}
                className="w-full m-0"
                isStreaming={false}
              >
                <ReasoningTrigger>
                  <BrainIcon />
                  Thoughts
                </ReasoningTrigger>
                <ReasoningContent className="border-b pb-4 border-zinc-200 mb-4">
                  {part.text}
                </ReasoningContent>
              </Reasoning>
            );
          case "file":
            return (
              <div
                key={`${message.id}-${i}`}
                className="min-[1700px]:absolute -left-32 top-4"
              >
                {message.metadata?.runId ? (
                  <PendingImage
                    runId={(message.metadata as any).runId}
                    publicAccessToken={(message.metadata as any).publicToken}
                    onClick={() => setChatMessageId(message.id)}
                  />
                ) : (
                  <img
                    src={getImageUrl(part.url)}
                    className="rounded-xl w-30 cursor-zoom-in"
                    onClick={() => setChatMessageId(message.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setChatMessageId(message.id);
                    }}
                  />
                )}
              </div>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

type ChatMessageContentEditorProps = {
  message: PersonaUIMessage;
};

function ChatMessageContentEditor({ message }: ChatMessageContentEditorProps) {
  const text = useMemo(() => {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p: any) => p.text)
      .join("\n\n");
  }, [message]);
  const [editMessage, setEditMessage] = useState(text);
  const [editMessageId, setEditMessageId] = useEditMessage();
  const [chatId] = useChatId();

  const {
    chat,
    branches: branchesData,
    branchesIsLoading,
    addItemToBranch,
  } = useChatContext();
  const { regenerate, setMessages } = useChat({ chat });
  const branchesCtx = useChatBranchesContext();

  return (
    <>
      <div>
        <div className="flex items-center gap-1 text-zinc-500 text-sm">
          <PencilLineIcon className="text-zinc-500" />
          Editing message
        </div>
      </div>
      <TextareaAutosize
        value={editMessage}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setEditMessage(e.target.value);
        }}
        className="bg-transparent border-none outline-none shadow-none min-w-24 p-1 m-0 min-h-0 h-auto ring-0 focus:ring-0 focus-visible:ring-0 focus:ring-transparent focus-visible:ring-transparent focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-none focus-visible:border-transparent active:border-none active:outline-none focus:outline-none focus-visible:outline-none outline-0"
        minRows={1}
        maxRows={6}
      />
      <div className="flex items-center justify-end gap-1">
        <Button onClick={() => setEditMessageId(null)} variant="ghost">
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (!editMessage.trim()) {
              return;
            }

            const id = `msg_${nanoid(22)}`;

            regenerate({
              messageId: message.id,
              body: {
                newMessageId: id,
                parentId: message.metadata?.parentId,
                newContent: editMessage,
                regenerate: true,
                chatId: chatId,
              },
            });

            setMessages((msgs) =>
              msgs.map((m) =>
                m.id === message.id
                  ? { ...m, parts: [{ type: "text", text: editMessage }], id }
                  : m
              )
            );

            // Optimistically reflect branching for user messages (siblings under the same parent)
            const parentKey =
              message.metadata?.parentId ?? ROOT_BRANCH_PARENT_ID;
            addItemToBranch(parentKey, {
              id: message.id,
              createdAt: new Date(),
            });

            branchesCtx.setActiveId(undefined);

            setEditMessageId(null);
          }}
          variant="outline"
        >
          Save
        </Button>
      </div>
    </>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [editMessageId, setEditMessageId] = useEditMessage();

  return (
    <div className="flex group/chat-message flex-col gap-1">
      <Message from={message.role} className="p-0 relative">
        <MessageContent className="overflow-visible  px-3 py-2 group-[.is-user]:bg-zinc-100 group-[.is-user]:text-[#212529] group-[.is-user]:border-zinc-200 group-[.is-user]:border-1 group-[.is-assistant]:bg-transparent">
          {editMessageId === message.id ? (
            <ChatMessageContentEditor message={message} />
          ) : (
            <ChatMessageContent message={message} />
          )}
        </MessageContent>
      </Message>
      <Actions className="opacity-0 group-hover/chat-message:opacity-100 transition-opacity mt-0 duration-250">
        {message.role === "user" ? (
          <UserMessageActions
            messageId={message.id}
            parentId={message.metadata?.parentId ?? undefined}
            copyText={message.parts
              .filter((p) => p.type === "text")
              .map((p: any) => p.text)
              .join("\n\n")}
          />
        ) : (
          <AssistantMessageActions
            messageId={message.id}
            parentId={message.metadata?.parentId ?? undefined}
            copyText={message.parts
              .filter((p) => p.type === "text")
              .map((p: any) => p.text)
              .join("\n\n")}
          />
        )}
      </Actions>
    </div>
  );
}

type UserMessageActionsProps = {
  messageId: string;
  parentId?: string;
  copyText: string;
};

function UserMessageActions(props: UserMessageActionsProps) {
  const branchesCtx = useChatBranchesContext();
  const [chatId] = useChatId();
  const [copiedText, copy] = useCopyToClipboard();
  const copied = copiedText === props.copyText;
  const [, setChatBranchId] = useChatBranchId();

  const {
    chat,
    branches: branchesData,
    branchesIsLoading,
    addItemToBranch,
  } = useChatContext();
  const { regenerate } = useChat({ chat });
  const [, setEditMessageId] = useEditMessage();

  const parentKey = props.parentId ?? ROOT_BRANCH_PARENT_ID;

  const branch = useMemo(() => {
    if (!branchesData) return;
    return branchesData[parentKey];
  }, [parentKey, branchesData]);

  const numberOfBranches = useMemo(() => {
    if (!branch) return 0;
    return branch.length;
  }, [branch]);

  const indexOfCurrentBranch = useMemo(() => {
    if (!branch) return 0;
    return branch.findIndex((b) => b.id === props.messageId);
  }, [branch, props.messageId]);

  const handleCopy = async () => {
    await copy(props.copyText ?? "");
  };

  const handleEdit = () => {
    setEditMessageId(props.messageId);
  };

  return (
    <div className="flex items-center gap-1 ml-auto">
      <Action
        onClick={handleEdit}
        className="
         transition scale-95 duration-180 hover:scale-100 will-change-transform active:scale-95 hover:bg-[#f8f9fa] text-[#6c757d] hover:text-[#495057]
         motion-reduce:transition-none
         ml-auto
         motion-reduce:hover:scale-100"
      >
        <PencilLineIcon />
      </Action>

      <Action
        onClick={() => {
          if (!branch || indexOfCurrentBranch === 0) return;
          const previousBranch = branch[indexOfCurrentBranch - 1];
          if (!previousBranch) return;
          branchesCtx.setActiveId(previousBranch.id);
        }}
        disabled={indexOfCurrentBranch === 0}
        tooltip="Switch to Previous Branch"
        className="transition-all scale-95 duration-250 hover:scale-100 active:scale-95 hover:bg-[#f8f9fa] text-[#6c757d] hover:text-[#495057]"
      >
        <CaretLeftIcon />
      </Action>

      {chat.status === "streaming" || branchesIsLoading ? (
        <Action disabled>
          <CircleNotchIcon className="animate-spin" />
        </Action>
      ) : (
        <Action
          onClick={() => {
            setChatBranchId(parentKey);
          }}
          tooltip="Preview Branches"
          className="px-2 w-auto transition-all scale-95 duration-250 hover:scale-100 active:scale-95 hover:bg-[#f8f9fa] text-[#6c757d] hover:text-[#495057]"
        >
          <span>{indexOfCurrentBranch + 1}</span>
          <span className="text-xs">/</span>
          <span>{numberOfBranches > 0 ? numberOfBranches : 1}</span>
        </Action>
      )}

      <Action
        onClick={() => {
          if (
            !branch ||
            indexOfCurrentBranch === numberOfBranches - 1 ||
            numberOfBranches === 0
          )
            return;
          const nextBranch = branch[indexOfCurrentBranch + 1];
          if (!nextBranch) return;
          branchesCtx.setActiveId(nextBranch.id);
        }}
        disabled={
          indexOfCurrentBranch === numberOfBranches - 1 ||
          numberOfBranches === 0
        }
        tooltip="Switch to Next Branch"
        className="transition-all scale-95 duration-250 hover:scale-100 active:scale-95 hover:bg-[#f8f9fa] text-[#6c757d] hover:text-[#495057]"
      >
        <CaretRightIcon />
      </Action>

      <Action
        onClick={handleCopy}
        className="
         transition scale-95 duration-180 hover:scale-100 will-change-transform active:scale-95 hover:bg-[#f8f9fa] text-[#6c757d] hover:text-[#495057]
         motion-reduce:transition-none
         ml-auto
         motion-reduce:hover:scale-100"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Action>
    </div>
  );
}

type AssistantMessageActionsProps = {
  messageId: string;
  parentId?: string;
  copyText: string;
};

function AssistantMessageActions(props: AssistantMessageActionsProps) {
  const branchesCtx = useChatBranchesContext();
  const [chatId] = useChatId();
  const [copiedText, copy] = useCopyToClipboard();
  const copied = copiedText === props.copyText;
  const [, setChatBranchId] = useChatBranchId();

  const {
    chat,
    branches: branchesData,
    branchesIsLoading,
    addItemToBranch,
  } = useChatContext();
  const { regenerate } = useChat({ chat });

  const branch = useMemo(() => {
    if (!branchesData || !props.parentId) return;
    return branchesData[props.parentId];
  }, [props.parentId, branchesData]);

  const numberOfBranches = useMemo(() => {
    if (!branch) return 0;
    return branch.length;
  }, [branch]);

  const indexOfCurrentBranch = useMemo(() => {
    if (!branch) return 0;
    return branch.findIndex((b) => b.id === props.messageId);
  }, [branch, props.messageId]);

  const handleCopy = async () => {
    await copy(props.copyText ?? "");
  };

  return (
    <>
      <Action
        onClick={() => {
          regenerate({
            messageId: props.messageId,
            body: {
              regenerate: true,
              chatId,
            },
          });

          if (props.parentId) {
            addItemToBranch(props.parentId, {
              id: props.messageId,
              createdAt: new Date(),
            });
          }

          branchesCtx.setActiveId(undefined);
        }}
        tooltip="Regenerate"
        className="transform-gpu [will-change:transform] transition-all duration-300 ease-in hover:duration-200 hover:ease-out active:scale-95 hover:bg-[#f8f9fa] text-[#6c757d] hover:text-[#495057] hover:scale-[1.02]"
      >
        <ArrowsClockwiseIcon />
      </Action>

      <Action
        onClick={() => {
          if (!branch || indexOfCurrentBranch === 0) return;
          const previousBranch = branch[indexOfCurrentBranch - 1];
          if (!previousBranch) return;
          branchesCtx.setActiveId(previousBranch.id);
        }}
        disabled={indexOfCurrentBranch === 0}
        tooltip="Switch to Previous Branch"
        className="transition-all scale-95 duration-250 hover:scale-100 active:scale-95 hover:bg-[#f8f9fa] text-[#6c757d] hover:text-[#495057]"
      >
        <CaretLeftIcon />
      </Action>

      {chat.status === "streaming" || branchesIsLoading ? (
        <Action disabled>
          <CircleNotchIcon className="animate-spin" />
        </Action>
      ) : (
        <Action
          onClick={() => {
            if (!props.parentId) return;
            setChatBranchId(props.parentId);
          }}
          tooltip="Preview Branches"
          className="px-2 w-auto transition-all scale-95 duration-250 hover:scale-100 active:scale-95 hover:bg-[#f8f9fa] text-[#6c757d] hover:text-[#495057]"
        >
          <span>{indexOfCurrentBranch + 1}</span>
          <span className="text-xs">/</span>
          <span>{numberOfBranches > 0 ? numberOfBranches : 1}</span>
        </Action>
      )}

      <Action
        onClick={() => {
          if (
            !branch ||
            indexOfCurrentBranch === numberOfBranches - 1 ||
            numberOfBranches === 0
          )
            return;
          const nextBranch = branch[indexOfCurrentBranch + 1];
          if (!nextBranch) return;
          branchesCtx.setActiveId(nextBranch.id);
        }}
        disabled={
          indexOfCurrentBranch === numberOfBranches - 1 ||
          numberOfBranches === 0
        }
        tooltip="Switch to Next Branch"
        className="transition-all scale-95 duration-250 hover:scale-100 active:scale-95 hover:bg-[#f8f9fa] text-[#6c757d] hover:text-[#495057]"
      >
        <CaretRightIcon />
      </Action>

      <Action
        onClick={handleCopy}
        tooltip={copied ? "Copied!" : "Copy"}
        className="
         transition scale-95 duration-180 hover:scale-100 will-change-transform active:scale-95 hover:bg-[#f8f9fa] text-[#6c757d] hover:text-[#495057]
         motion-reduce:transition-none
         motion-reduce:hover:scale-100"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Action>
    </>
  );
}

function PendingImage({
  runId,
  publicAccessToken,
  onClick,
}: {
  runId: string;
  publicAccessToken: string;
  onClick?: () => void;
}) {
  const { run } = useRun(runId, {
    accessToken: publicAccessToken,
    refreshInterval: ms("10s"),
  });

  if (run?.status !== "COMPLETED")
    return (
      <div>
        <MiniWaveLoader />
      </div>
    );

  return (
    <img
      className="rounded-xl w-30 cursor-zoom-in"
      src={run.output.imageUrl}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    />
  );
}
