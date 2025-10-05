import * as ReasoningBase from "../../ai-elements/reasoning";

export type ReasoningProps = React.ComponentProps<
  typeof ReasoningBase.Reasoning
>;
export const Reasoning = ReasoningBase.Reasoning;

export type ReasoningTriggerProps = React.ComponentProps<
  typeof ReasoningBase.ReasoningTrigger
>;
export const ReasoningTrigger = ReasoningBase.ReasoningTrigger;

export type ReasoningContentProps = React.ComponentProps<
  typeof ReasoningBase.ReasoningContent
>;
export const ReasoningContent = ReasoningBase.ReasoningContent;