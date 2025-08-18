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
  character: z.string().min(1).max(255),
});

export type ChatSettingsUserPersona = z.infer<
  typeof chatSettingsUserPersonaSchema
>;

/**
 * Chat Settings
 */
export const chatSettingsSchema = z.object({
  model: z.string().nullable().optional(),
  user_persona: chatSettingsUserPersonaSchema.nullable().optional(),
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
