import { z } from "zod/v4";

/**
 * Chat ID
 */
export const chatIdSchema = z.string().startsWith("pch_").length(25);

export type ChatId = z.infer<typeof chatIdSchema>;

/**
 * NSFW Guidelines
 * - nsfw_prohibited: keep PG-13, strictly SFW
 * - nsfw_allowed_suggestive: allow suggestive NSFW, natural, not forced
 * - nsfw_explicit_natural: allow explicit content, natural flow, not forced
 * - nsfw_explicit_driven: slightly pushes explicit NSFW content
 */
export const nsfwGuidelinesSchema = z.enum([
  "nsfw_prohibited",
  "nsfw_allowed_suggestive",
  "nsfw_explicit_natural",
  "nsfw_explicit_driven",
]);

export type NSFWGuidelines = z.infer<typeof nsfwGuidelinesSchema>;

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
 * Chat Settings Scenario
 * Single property object for custom chat scenario
 */
export const chatSettingsScenarioSchema = z.object({
  scenario: z.string().min(0).max(4000),
});

export type ChatSettingsScenario = z.infer<typeof chatSettingsScenarioSchema>;

/**
 * Chat Settings
 */
export const chatSettingsSchema = z.object({
  model: z.string().nullable().optional(),
  user_persona: chatSettingsUserPersonaSchema.nullable().optional(),
  scenario: chatSettingsScenarioSchema.nullable().optional(),
  nsfw_guidelines: nsfwGuidelinesSchema.nullable().optional(),
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
