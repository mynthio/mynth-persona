import { z } from "zod/v4";

/**
 * Chat ID
 */
export const chatIdSchema = z.string().startsWith("pch_").length(25);

export type ChatId = z.infer<typeof chatIdSchema>;

/**
 * Chat Settings User Persona
 */
export const chatSettingsUserPersonaSchema = z.object({
  enabled: z.boolean(),
  name: z.string().min(1).max(64),
  character: z.string().min(0).max(255).optional(),
});

export type ChatSettingsUserPersona = z.infer<
  typeof chatSettingsUserPersonaSchema
>;

/**
 * Starting message schema for chat settings (v4 compatible)
 */
const chatStartingMessageSchema = z.object({
  role: z.enum(["user", "persona"]),
  text: z.string(),
});

/**
 * Chat Settings Scenario
 */
export const chatSettingsScenarioSchema = z.object({
  scenarioId: z.string().startsWith("scn_").optional(), // Reference to source scenario
  scenario_text: z.string(),
  starting_messages: z.array(chatStartingMessageSchema).optional(),
  style_guidelines: z.string().optional(),
  system_prompt_override: z.string().optional(),
});

export type ChatSettingsScenario = z.infer<typeof chatSettingsScenarioSchema>;

/**
 * Chat Settings
 */
export const chatSettingsSchema = z.object({
  model: z.string().nullable().optional(),
  user_persona: chatSettingsUserPersonaSchema.nullable().optional(),
  scenario: chatSettingsScenarioSchema.nullable().optional(),
});

export type ChatSettings = z.infer<typeof chatSettingsSchema>;

/**
 * Chat Mode
 */
export const chatModeSchema = z.enum(["roleplay", "story"]);

export type ChatMode = z.infer<typeof chatModeSchema>;

/**
 * Chat
 */
export const chatSchema = z.object({
  id: chatIdSchema,
  settings: chatSettingsSchema.nullable().optional(),
  title: z.string().nullable(),
  mode: chatModeSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Chat = z.infer<typeof chatSchema>;
