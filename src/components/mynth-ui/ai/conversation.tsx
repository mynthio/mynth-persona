import * as ConversationBase from "../../ai-elements/conversation";

export type ConversationProps = React.ComponentProps<
  typeof ConversationBase.Conversation
>;

export const Conversation = ConversationBase.Conversation;

export type ConversationContentProps = React.ComponentProps<
  typeof ConversationBase.ConversationContent
>;

export const ConversationContent = ConversationBase.ConversationContent;
