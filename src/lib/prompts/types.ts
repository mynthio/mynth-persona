import { PersonaVersionRoleplayData } from "@/schemas";
import { ChatSettingsUserPersona } from "@/schemas/backend/chats/chat.schema";
import { PersonaData } from "@/types/persona.type";
import { ShotType } from "@/types/image-generation/shot-type.type";
import { ImageStyle } from "@/types/image-generation/image-style.type";

// Kinds of prompts
export type PromptKind = "system" | "prompt";

// Separate modes for chats and personas
export type ChatPromptMode = "roleplay" | "story";
export type PersonaPromptMode = "generate" | "enhance" | "publish";
export type ImagePromptMode = "persona"; // image prompts (extendable)
export type PromptUseCase = "chat" | "persona" | "image";

export type PromptVersion = `v${number}`;

// ID formats with first segment being the prompt kind
export type SystemPromptIdForChat<M extends ChatPromptMode = ChatPromptMode> =
  `system.chat.${M}.${PromptVersion}`;
export type SystemPromptIdForPersona<
  M extends PersonaPromptMode = PersonaPromptMode
> = `system.persona.${M}.${PromptVersion}`;
export type SystemPromptIdForImage<
  M extends ImagePromptMode = ImagePromptMode
> = `system.image.${M}.${PromptVersion}`;

// New: Specific ID type for persona property action prompts
export type SystemPromptIdForPersonaPropertyAction =
  `system.persona.property-action.${PromptVersion}`;
export type UserPromptIdForChat<M extends ChatPromptMode = ChatPromptMode> =
  `prompt.chat.${M}.${PromptVersion}`;
export type UserPromptIdForPersona<
  M extends PersonaPromptMode = PersonaPromptMode
> = `prompt.persona.${M}.${PromptVersion}`;
export type UserPromptIdForImage<M extends ImagePromptMode = ImagePromptMode> =
  `prompt.image.${M}.${PromptVersion}`;

export type PromptId =
  | SystemPromptIdForChat
  | SystemPromptIdForPersona
  | SystemPromptIdForImage
  | SystemPromptIdForPersonaPropertyAction
  | UserPromptIdForChat
  | UserPromptIdForPersona
  | UserPromptIdForImage;

export interface RoleplayRenderArgs {
  character: PersonaVersionRoleplayData;
  user?: ChatSettingsUserPersona | null;
}

export interface StoryRenderArgs {
  character: PersonaVersionRoleplayData;
}

export type PromptDefinitionRenderFunction<T> = (args: T) => string;

export interface PromptDefinitionBase {
  id: PromptId;
  version: PromptVersion;
  label: string;
  description?: string;
}

// System prompt definitions
export interface PromptDefinitionRoleplay extends PromptDefinitionBase {
  id: SystemPromptIdForChat<"roleplay">;
  mode: "roleplay";
  render: PromptDefinitionRenderFunction<RoleplayRenderArgs>;
}

export interface PromptDefinitionStory extends PromptDefinitionBase {
  id: SystemPromptIdForChat<"story">;
  mode: "story";
  render: PromptDefinitionRenderFunction<StoryRenderArgs>;
}

// Persona system prompt definitions
export interface PromptDefinitionPersonaGenerate extends PromptDefinitionBase {
  id: SystemPromptIdForPersona<"generate">;
  mode: "generate";
  render: () => string;
}

export interface PromptDefinitionPersonaEnhance extends PromptDefinitionBase {
  id: SystemPromptIdForPersona<"enhance">;
  mode: "enhance";
  render: PromptDefinitionRenderFunction<{ current: PersonaData }>;
}

// Persona publish mode interfaces
export interface PromptDefinitionPersonaPublish extends PromptDefinitionBase {
  id: SystemPromptIdForPersona<"publish">;
  mode: "publish";
  render: () => string;
}

// New: Persona property action system prompt definition
export interface PromptDefinitionPersonaPropertyAction
  extends PromptDefinitionBase {
  id: SystemPromptIdForPersonaPropertyAction;
  mode: "property-action";
  render: PromptDefinitionRenderFunction<{
    property: string;
    action: "expand" | "rewrite";
  }>;
}

export interface PromptDefinitionPromptPersonaPublish
  extends PromptDefinitionBase {
  id: UserPromptIdForPersona<"publish">;
  mode: "publish";
  render: PromptDefinitionRenderFunction<{ persona: PersonaData }>;
}

// Image system prompt definitions
export interface PromptDefinitionImagePersona extends PromptDefinitionBase {
  id: SystemPromptIdForImage<"persona">;
  mode: "persona";
  render: PromptDefinitionRenderFunction<{ modelName: string; nsfw: boolean }>;
}

// Non-system (user) prompt definitions
export interface PromptDefinitionPromptImagePersona
  extends PromptDefinitionBase {
  id: UserPromptIdForImage<"persona">;
  mode: "persona";
  render: PromptDefinitionRenderFunction<{
    persona: PersonaData;
    style: ImageStyle;
    shotType: ShotType;
    nsfw: boolean;
    userNote?: string;
  }>;
}

export type PromptDefinition =
  | PromptDefinitionRoleplay
  | PromptDefinitionStory
  | PromptDefinitionPersonaGenerate
  | PromptDefinitionPersonaEnhance
  | PromptDefinitionPersonaPublish
  | PromptDefinitionPromptPersonaPublish
  | PromptDefinitionImagePersona
  | PromptDefinitionPromptImagePersona
  | PromptDefinitionPersonaPropertyAction;
