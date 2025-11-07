import { cn } from "@/lib/utils";
import * as PromptInputBase from "../../ai-elements/prompt-input";

// Hook re-export
export const usePromptInputAttachments =
  PromptInputBase.usePromptInputAttachments;

// Core types
export type PromptInputMessage = PromptInputBase.PromptInputMessage;

// Component re-exports with prop types derived from base components
export type PromptInputProps = React.ComponentProps<
  typeof PromptInputBase.PromptInput
>;
export const PromptInput = (props: PromptInputProps) => {
  return (
    <PromptInputBase.PromptInput
      {...props}
      className={cn(
        "bg-white outline-[2px] outline-surface-100 rounded-[32px] h-auto divide-none border-none",
        props.className
      )}
    />
  );
};

export type PromptInputBodyProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputBody
>;
export const PromptInputBody = PromptInputBase.PromptInputBody;

export type PromptInputTextareaProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputTextarea
>;
export const PromptInputTextarea = (props: PromptInputTextareaProps) => {
  return (
    <PromptInputBase.PromptInputTextarea
      {...props}
      className={cn(
        "px-[1.45rem] py-[1.35rem] placeholder:text-[.98rem] text-[1.25rem] placeholder:text-surface-foreground/50 text-surface-foreground",
        props.className
      )}
    />
  );
};

export type PromptInputFooterProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputFooter
>;
export const PromptInputFooter = PromptInputBase.PromptInputTools;

export type PromptInputToolsProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputTools
>;
export const PromptInputTools = PromptInputBase.PromptInputTools;

export type PromptInputButtonProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputButton
>;
export const PromptInputButton = PromptInputBase.PromptInputButton;

export type PromptInputAttachmentProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputAttachment
>;
export const PromptInputAttachment = PromptInputBase.PromptInputAttachment;

export type PromptInputAttachmentsProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputAttachments
>;
export const PromptInputAttachments = PromptInputBase.PromptInputAttachments;

export type PromptInputActionAddAttachmentsProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputActionAddAttachments
>;
export const PromptInputActionAddAttachments =
  PromptInputBase.PromptInputActionAddAttachments;

export type PromptInputActionMenuProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputActionMenu
>;
export const PromptInputActionMenu = PromptInputBase.PromptInputActionMenu;

export type PromptInputActionMenuTriggerProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputActionMenuTrigger
>;
export const PromptInputActionMenuTrigger =
  PromptInputBase.PromptInputActionMenuTrigger;

export type PromptInputActionMenuContentProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputActionMenuContent
>;
export const PromptInputActionMenuContent =
  PromptInputBase.PromptInputActionMenuContent;

export type PromptInputActionMenuItemProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputActionMenuItem
>;
export const PromptInputActionMenuItem =
  PromptInputBase.PromptInputActionMenuItem;

export type PromptInputSubmitProps = React.ComponentProps<
  typeof PromptInputBase.PromptInputSubmit
>;
export const PromptInputSubmit = PromptInputBase.PromptInputSubmit;
