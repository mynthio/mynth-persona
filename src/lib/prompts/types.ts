import { PersonaVersionRoleplayData } from "@/schemas";
import { ChatSettingsUserPersona } from "@/schemas/backend/chats/chat.schema";
import { PersonaData } from "@/types/persona.type";

// Separate modes for chats and personas
export type ChatPromptMode = "roleplay" | "story";
export type PersonaPromptMode = "generate" | "enhance";
export type PromptUseCase = "chat" | "persona";

export type PromptVersion = `v${number}`;

// ID formats with dependent second segment based on the first
export type PromptIdForChat<M extends ChatPromptMode = ChatPromptMode> = `chat.${M}.${PromptVersion}`;
export type PromptIdForPersona<M extends PersonaPromptMode = PersonaPromptMode> = `persona.${M}.${PromptVersion}`;
export type PromptId = PromptIdForChat | PromptIdForPersona;

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

export interface PromptDefinitionRoleplay extends PromptDefinitionBase {
  id: PromptIdForChat<"roleplay">;
  mode: "roleplay";
  render: PromptDefinitionRenderFunction<RoleplayRenderArgs>;
}

export interface PromptDefinitionStory extends PromptDefinitionBase {
  id: PromptIdForChat<"story">;
  mode: "story";
  render: PromptDefinitionRenderFunction<StoryRenderArgs>;
}

// Persona prompt definitions
export interface PromptDefinitionPersonaGenerate extends PromptDefinitionBase {
  id: PromptIdForPersona<"generate">;
  mode: "generate";
  render: () => string;
}

export interface PromptDefinitionPersonaEnhance extends PromptDefinitionBase {
  id: PromptIdForPersona<"enhance">;
  mode: "enhance";
  render: PromptDefinitionRenderFunction<{ current: PersonaData }>;
}

export type PromptDefinition =
  | PromptDefinitionRoleplay
  | PromptDefinitionStory
  | PromptDefinitionPersonaGenerate
  | PromptDefinitionPersonaEnhance;
