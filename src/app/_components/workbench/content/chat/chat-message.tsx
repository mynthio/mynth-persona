import { useChatBranchesContext } from "@/app/(chat)/_contexts/chat-branches.context";
import { useChatContext } from "@/app/(chat)/_contexts/chat.context";
import { Action, Actions } from "@/components/ai-elements/actions";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { MiniWaveLoader } from "@/components/ui/mini-wave-loader";

import { useChatId } from "@/hooks/use-chat-id.hook";
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
} from "@phosphor-icons/react/dist/ssr";
import { useRun } from "@trigger.dev/react-hooks";
import ms from "ms";
import { useMemo, useState } from "react";
import { useChatMessageId } from "@/hooks/use-chat-message-id.hook";
import { useChatBranchId } from "@/hooks/use-chat-branch-id.hook";

type ChatMessageProps = {
  message: PersonaUIMessage;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const [, setChatMessageId] = useChatMessageId();
  return (
    <div className="flex group/chat-message flex-col gap-1">
      <Message from={message.role} className="p-0 relative">
        <MessageContent className="overflow-visible  px-3 py-2 group-[.is-user]:bg-zinc-100 group-[.is-user]:text-[#212529] group-[.is-user]:border-zinc-200 group-[.is-user]:border-1 group-[.is-assistant]:bg-transparent">
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text": // we don't use any reasoning or tool calls in this example
                return (
                  <Response key={`${message.id}-${i}`}>{part.text}</Response>
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
                        publicAccessToken={
                          (message.metadata as any).publicToken
                        }
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
        </MessageContent>
      </Message>
      <Actions className="opacity-0 group-hover/chat-message:opacity-100 transition-opacity mt-0 duration-250">
        {message.role === "user" ? (
          <UserMessageActions
            messageId={message.id}
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
  copyText: string;
};

function UserMessageActions(props: UserMessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(props.copyText ?? "");
      } else {
        const el = document.createElement("textarea");
        el.value = props.copyText ?? "";
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // noop; keep silent to maintain UX consistency
    }
  };

  return (
    <>
      <Action
        onClick={handleCopy}
        tooltip={copied ? "Copied!" : "Copy"}
        className="
         transition scale-95 duration-180 hover:scale-100 will-change-transform active:scale-95 hover:bg-[#f8f9fa] text-[#6c757d] hover:text-[#495057]
         motion-reduce:transition-none
         ml-auto
         motion-reduce:hover:scale-100"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Action>
    </>
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
  const [copied, setCopied] = useState(false);
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
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(props.copyText ?? "");
      } else {
        const el = document.createElement("textarea");
        el.value = props.copyText ?? "";
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // noop; keep silent to maintain UX consistency
    }
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
