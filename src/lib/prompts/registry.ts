// src/lib/prompts/registry.ts
import { roleplayV1 } from "./templates/roleplay/system.chat.roleplay.v1";
import { storyV1 } from "./templates/story/system.chat.story.v1";
import { personaGenerateV1 } from "./templates/persona/system.persona.generate.v1";
import { personaEnhanceV1 } from "./templates/persona/system.persona.enhance.v1";
import { personaPublishV1 } from "./templates/persona/system.persona.publish.v1";
import { personaPublishPromptV1 } from "./templates/persona/prompt.persona.publish.v1";
import { imagePersonaV1 } from "./templates/image/system.image.persona.v1";
import { imagePersonaPromptV1 } from "./templates/image/prompt.image.persona.v1";
import {
  PromptDefinition,
  PromptId,
  ChatPromptMode,
  PersonaPromptMode,
  PromptUseCase,
  PromptDefinitionRoleplay,
  PromptDefinitionStory,
  PromptDefinitionPersonaGenerate,
  PromptDefinitionPersonaEnhance,
  PromptDefinitionPersonaPublish,
  PromptDefinitionPromptPersonaPublish,
  PromptDefinitionImagePersona,
  PromptDefinitionPromptImagePersona,
  SystemPromptIdForChat,
  SystemPromptIdForPersona,
  SystemPromptIdForImage,
  UserPromptIdForChat,
  UserPromptIdForPersona,
  UserPromptIdForImage,
} from "./types";

const PROMPTS = {
  [storyV1.id]: storyV1,
  [roleplayV1.id]: roleplayV1,
  [personaGenerateV1.id]: personaGenerateV1,
  [personaEnhanceV1.id]: personaEnhanceV1,
  [personaPublishV1.id]: personaPublishV1,
  [personaPublishPromptV1.id]: personaPublishPromptV1,
  [imagePersonaV1.id]: imagePersonaV1,
  [imagePersonaPromptV1.id]: imagePersonaPromptV1,
} as const satisfies Partial<Record<PromptId, PromptDefinition>>;

// Separate defaults: system vs user prompts
export type DefaultSystemPromptMapByUseCase = {
  chat: Record<ChatPromptMode, SystemPromptIdForChat>;
  persona: Record<PersonaPromptMode, SystemPromptIdForPersona>;
  image: Record<"persona", SystemPromptIdForImage>;
};

export type DefaultUserPromptMapByUseCase = {
  chat: Partial<Record<ChatPromptMode, UserPromptIdForChat>>;
  persona: Partial<Record<PersonaPromptMode, UserPromptIdForPersona>>;
  image: Record<"persona", UserPromptIdForImage>;
};

export const DEFAULT_SYSTEM_PROMPTS_BY_USE_CASE: DefaultSystemPromptMapByUseCase =
  {
    chat: {
      roleplay: roleplayV1.id,
      story: storyV1.id,
    },
    persona: {
      generate: personaGenerateV1.id,
      enhance: personaEnhanceV1.id,
      publish: personaPublishV1.id,
    },
    image: {
      persona: imagePersonaV1.id,
    },
  };

export const DEFAULT_PROMPTS_BY_USE_CASE: DefaultUserPromptMapByUseCase = {
  chat: {}, // currently no non-system chat prompts
  persona: {
    publish: personaPublishPromptV1.id,
  },
  image: {
    persona: imagePersonaPromptV1.id,
  },
};

export function getPromptDefinitionById(id: PromptId): PromptDefinition {
  const prompt = PROMPTS[id];

  if (!prompt) throw new Error("Prompt not found");

  return prompt;
}

// System defaults (new explicit API)
export function getDefaultSystemPromptDefinitionForMode(
  useCase: "chat",
  mode: ChatPromptMode
): PromptDefinitionRoleplay | PromptDefinitionStory;
export function getDefaultSystemPromptDefinitionForMode(
  useCase: "persona",
  mode: "generate"
): PromptDefinitionPersonaGenerate;
export function getDefaultSystemPromptDefinitionForMode(
  useCase: "persona",
  mode: "enhance"
): PromptDefinitionPersonaEnhance;
export function getDefaultSystemPromptDefinitionForMode(
  useCase: "persona",
  mode: "publish"
): PromptDefinitionPersonaPublish;
export function getDefaultSystemPromptDefinitionForMode(
  useCase: "image",
  mode: "persona"
): PromptDefinitionImagePersona;
export function getDefaultSystemPromptDefinitionForMode(
  useCase: PromptUseCase,
  mode: ChatPromptMode | PersonaPromptMode | "persona"
): PromptDefinition {
  const defaultPromptId = (
    DEFAULT_SYSTEM_PROMPTS_BY_USE_CASE[useCase] as Record<string, PromptId>
  )[mode];

  if (!defaultPromptId) throw new Error("No default system prompt found");

  return getPromptDefinitionById(defaultPromptId);
}

// User (non-system) defaults
export function getDefaultUserPromptDefinitionForMode(
  useCase: "persona",
  mode: "publish"
): PromptDefinitionPromptPersonaPublish;
export function getDefaultUserPromptDefinitionForMode(
  useCase: "image",
  mode: "persona"
): PromptDefinitionPromptImagePersona;
export function getDefaultUserPromptDefinitionForMode(
  useCase: PromptUseCase,
  mode: ChatPromptMode | PersonaPromptMode | "persona"
): PromptDefinition {
  const defaults = DEFAULT_PROMPTS_BY_USE_CASE[useCase] as Record<
    string,
    PromptId | undefined
  >;
  const defaultPromptId = defaults[mode];

  if (!defaultPromptId) throw new Error("No default user prompt found");

  return getPromptDefinitionById(defaultPromptId);
}

// Backward-compatible default getter (returns SYSTEM defaults)
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
  useCase: "persona",
  mode: "publish"
): PromptDefinitionPersonaPublish;
export function getDefaultPromptDefinitionForMode(
  useCase: "image",
  mode: "persona"
): PromptDefinitionImagePersona;
export function getDefaultPromptDefinitionForMode(
  useCase: PromptUseCase,
  mode: ChatPromptMode | PersonaPromptMode | "persona"
): PromptDefinition {
  return getDefaultSystemPromptDefinitionForMode(useCase as any, mode as any);
}
