import * as MessageBase from "../../ai-elements/message";
import { Avatar } from "../base/avatar";

export type MessageProps = React.ComponentProps<typeof MessageBase.Message>;

export const Message = MessageBase.Message;

export type MessageContentProps = React.ComponentProps<
  typeof MessageBase.MessageContent
>;

export const MessageContent = ({ children }: MessageContentProps) => {
  return (
    <div className="is-user:dark flex flex-col gap-[9px] overflow-hidden rounded-[24px] text-sm group-[.is-user]:max-w-[80%] group-[.is-user]:bg-white group-[.is-user]:text-surface-foreground group-[.is-user]:py-[12px] group-[.is-user]:px-[24px] group-[.is-user]:rounded-br-[6px] group-[.is-user]:border-[1px] group-[.is-user]:border-surface-100 group-[.is-assistant]:rounded-none group-[.is-assistant]:pl-[9px] group-[.is-assistant]:text-surface-foreground">
      {children}
    </div>
  );
};

export type MessageAvatarProps = React.ComponentProps<typeof Avatar>;

export const MessageAvatar = ({ src, fallback }: MessageAvatarProps) => {
  return <Avatar src={src} fallback={fallback} />;
};
