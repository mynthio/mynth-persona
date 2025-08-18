// src/lib/prompts/registry.ts
import { roleplayV1 } from "./templates/roleplay/roleplay.v1";
import { storyV1 } from "./templates/story/story.v1";
import { personaGenerateV1 } from "./templates/persona/generate.v1";
import { personaEnhanceV1 } from "./templates/persona/enhance.v1";
import {
  PromptDefinition,
  PromptId,
  PromptIdForChat,
  ChatPromptMode,
  PersonaPromptMode,
  PromptUseCase,
  PromptIdForPersona,
  PromptDefinitionRoleplay,
  PromptDefinitionStory,
  PromptDefinitionPersonaGenerate,
  PromptDefinitionPersonaEnhance,
} from "./types";

const PROMPTS: Record<PromptId, PromptDefinition> = {
  [storyV1.id]: storyV1,
  [roleplayV1.id]: roleplayV1,
  [personaGenerateV1.id]: personaGenerateV1,
  [personaEnhanceV1.id]: personaEnhanceV1,
};

// Unified defaults object: useCase -> mode -> default prompt id
export type DefaultPromptMapByUseCase = {
  chat: Record<ChatPromptMode, PromptIdForChat>;
  persona: Record<PersonaPromptMode, PromptIdForPersona>;
};

export const DEFAULT_PROMPTS_BY_USE_CASE: DefaultPromptMapByUseCase = {
  chat: {
    roleplay: roleplayV1.id,
    story: storyV1.id,
  },
  persona: {
    generate: personaGenerateV1.id,
    enhance: personaEnhanceV1.id,
  } as Record<PersonaPromptMode, PromptIdForPersona>,
};

export function getPromptDefinitionById(id: PromptId): PromptDefinition {
  const prompt = PROMPTS[id];

  if (!prompt) throw new Error("Prompt not found");

  return prompt;
}

// Overloads for better type inference by use case
export function getDefaultPromptDefinitionForMode(
  useCase: "chat",
  mode: ChatPromptMode
): PromptDefinitionRoleplay | PromptDefinitionStory;
export function getDefaultPromptDefinitionForMode(
  useCase: "persona",
  mode: "generate"
): PromptDefinitionPersonaGenerate;
export function getDefaultPromptDefinitionForMode(
  useCase: "persona",
  mode: "enhance"
): PromptDefinitionPersonaEnhance;
export function getDefaultPromptDefinitionForMode(
  useCase: PromptUseCase,
  mode: ChatPromptMode | PersonaPromptMode
): PromptDefinition {
  const defaultPromptId = (
    DEFAULT_PROMPTS_BY_USE_CASE[useCase] as Record<string, PromptId>
  )[mode];

  if (!defaultPromptId) throw new Error("No default prompt found");

  return getPromptDefinitionById(defaultPromptId);
}
