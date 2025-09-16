// import "server-only";

import {
  integer,
  text,
  pgTable,
  timestamp,
  jsonb,
  varchar,
  pgEnum,
  boolean,
  index,
  unique,
  AnyPgColumn,
  primaryKey,
  smallint,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Enums for better type safety
export const imageGenerationStatusEnum = pgEnum(
  "image_generation_status_enum",
  ["pending", "processing", "completed", "failed"]
);

export const transactionTypeEnum = pgEnum("transaction_type_enum", [
  "purchase",
  "refund",
]);

export const chatModeEnum = pgEnum("chat_mode_enum", ["roleplay", "story"]);

// New enums for public personas
export const personaVisibilityEnum = pgEnum("persona_visibility", [
  "private",
  "public",
  "deleted",
]);

export const nsfwRatingEnum = pgEnum("nsfw_rating", [
  "sfw",
  "suggestive",
  "explicit",
]);

export const personaGenderEnum = pgEnum("persona_gender", [
  "female",
  "male",
  "other",
]);

export const personaAgeBucketEnum = pgEnum("persona_age_bucket", [
  "unknown",
  "0-5",
  "6-12",
  "13-17",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65-plus",
]);

export const tagCategoryEnum = pgEnum("tag_category", [
  "appearance",
  "personality",
  "physical",
  "age",
  "style",
  "other",
]);

// Users table - references Clerk auth
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Personas table - basic metadata only
export const personas = pgTable(
  "personas",
  {
    id: text("id").primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    currentVersionId: text("current_version_id"),
    profileImageId: text("profile_image_id"),

    visibility: personaVisibilityEnum("visibility")
      .notNull()
      .default("private"),
    publicVersionId: text("public_version_id"),
    nsfwRating: nsfwRatingEnum("nsfw_rating").notNull().default("sfw"),
    gender: personaGenderEnum("gender").notNull().default("other"),
    headline: text("headline"),
    publicName: varchar("public_name", { length: 100 }),
    ageBucket: personaAgeBucketEnum("age_bucket").notNull().default("unknown"),
    likesCount: integer("likes_count").notNull().default(0),
    publishedAt: timestamp("published_at"),
    deletedAt: timestamp("deleted_at"),
    slug: varchar("slug", { length: 200 }),
    lastPublishAttempt: jsonb("last_publish_attempt"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("personas_user_id_idx").on(t.userId),
    index("personas_visibility_idx").on(t.visibility),
    index("personas_nsfw_rating_idx").on(t.nsfwRating),
    index("personas_gender_idx").on(t.gender),
    unique("personas_slug_unique").on(t.slug),
  ]
);

// Persona versions - actual persona data and versions
export const personaVersions = pgTable("persona_versions", {
  id: text("id").primaryKey(),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),
  title: text("title"),
  versionNumber: integer("version_number").notNull(), // For ordering and display
  data: jsonb("data").notNull(), // Generated persona JSON data - now includes summary, optional occupation, and extensions array
  roleplayData: jsonb("roleplay_data"), // Roleplay data with appearance and summary fields
  aiModel: varchar("ai_model", { length: 255 }).notNull(), // AI model used
  settings: jsonb("settings"), // Generation settings
  metadata: jsonb("metadata"), // Additional generation info (aiNote, userMessage, tokensCost, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chats table - chat sessions
export const chats = pgTable(
  "chats",
  {
    id: text("id").primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"), // Optional, by default "New chat" or "Untitled"
    mode: chatModeEnum("mode").notNull().default("roleplay"),
    settings: jsonb("settings"), // Chat settings including user persona and model
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("chats_user_id_idx").on(t.userId)]
);

// Chat personas junction table - many-to-many relationship between chats and personas
export const chatPersonas = pgTable(
  "chat_personas",
  {
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    personaId: text("persona_id")
      .notNull()
      .references(() => personas.id, { onDelete: "cascade" }),
    personaVersionId: text("persona_version_id")
      .notNull()
      .references(() => personaVersions.id, { onDelete: "cascade" }),
    settings: jsonb("settings"), // Persona-specific settings for this chat
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.chatId, t.personaId] })]
);

// Messages table - chat messages with branching support
export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    parentId: text("parent_id").references((): AnyPgColumn => messages.id, {
      onDelete: "cascade",
    }), // Self-reference for branching, nullable for root messages
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 255 }).notNull(), // 'user', 'assistant', etc.
    parts: jsonb("parts").notNull(), // Message content and parts
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("messages_chat_id_idx").on(t.chatId),
    index("messages_parent_id_idx").on(t.parentId),
  ]
);

// Image generations table - tracks the AI generation process/request
export const imageGenerations = pgTable("image_generations", {
  id: text("id").primaryKey(),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  runId: varchar("run_id", { length: 255 }), // Trigger.dev run ID for job tracking
  prompt: text("prompt").notNull(), // The actual prompt sent to AI
  aiModel: varchar("ai_model", { length: 255 }).notNull(),
  status: imageGenerationStatusEnum("status").notNull().default("pending"),
  tokensCost: integer("tokens_cost").notNull().default(0),
  errorMessage: text("error_message"), // If generation failed
  settings: jsonb("settings"), // Generation settings
  metadata: jsonb("metadata"), // Additional generation parameters, AI response metadata
  imageId: text("image_id").references(() => images.id, {
    onDelete: "set null",
  }), // Link to the generated image (one-to-one)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Images table - tracks generated images for gallery and chat messages
export const images = pgTable("images", {
  id: text("id").primaryKey(),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),
  messageId: text("message_id").references(() => messages.id, {
    onDelete: "cascade",
  }), // Optional reference to message for chat images
  isNSFW: boolean("is_nsfw").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tags table - predefined tags for personas
export const tags = pgTable(
  "tags",
  {
    id: text("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    category: tagCategoryEnum("category").notNull(),
    isVisible: boolean("is_visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("tags_name_unique").on(t.name)]
);

// Persona-Tags junction with confidence 0-100
export const personaTags = pgTable(
  "persona_tags",
  {
    personaId: text("persona_id")
      .notNull()
      .references(() => personas.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    confidence: smallint("confidence").notNull().default(100),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.personaId, t.tagId] }),
    check(
      "persona_tags_confidence_check",
      sql`${t.confidence} >= 0 AND ${t.confidence} <= 100`
    ),
  ]
);

// User tokens - current balance and daily usage tracking
export const userTokens = pgTable("user_tokens", {
  userId: varchar("user_id", { length: 255 })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0), // Current token balance
  dailyTokensUsed: integer("daily_tokens_used").notNull().default(0), // Daily free tokens used today
  lastDailyReset: timestamp("last_daily_reset"), // When daily usage was last reset
  totalPurchased: integer("total_purchased").notNull().default(0), // Lifetime purchased tokens
  totalSpent: integer("total_spent").notNull().default(0), // Lifetime spent tokens
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Token transactions - complete audit trail (NO CASCADE - preserve for accounting)
export const tokenTransactions = pgTable("token_transactions", {
  id: text("id").primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id), // NO CASCADE - preserve audit trail
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(), // Positive for add, negative for spend
  balanceAfter: integer("balance_after").notNull(), // Balance after this transaction
  orderId: varchar("order_id", { length: 255 }), // Stripe/payment provider ID
  checkoutId: varchar("checkout_id", { length: 255 }), // Polar checkout ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for better querying
export const usersRelations = relations(users, ({ one, many }) => ({
  personas: many(personas),
  tokens: one(userTokens),
  tokenTransactions: many(tokenTransactions),
  chats: many(chats),
}));

export const personasRelations = relations(personas, ({ one, many }) => ({
  user: one(users, {
    fields: [personas.userId],
    references: [users.id],
  }),
  currentVersion: one(personaVersions, {
    fields: [personas.currentVersionId],
    references: [personaVersions.id],
  }),
  publicVersion: one(personaVersions, {
    fields: [personas.publicVersionId],
    references: [personaVersions.id],
  }),
  versions: many(personaVersions),
  imageGenerations: many(imageGenerations),
  images: many(images),
  chatPersonas: many(chatPersonas),
  profileImage: one(images, {
    fields: [personas.profileImageId],
    references: [images.id],
  }),
  personaTags: many(personaTags),
}));

export const personaVersionsRelations = relations(
  personaVersions,
  ({ one, many }) => ({
    persona: one(personas, {
      fields: [personaVersions.personaId],
      references: [personas.id],
    }),
    chatPersonas: many(chatPersonas),
  })
);

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
  chatPersonas: many(chatPersonas),
}));

export const chatPersonasRelations = relations(chatPersonas, ({ one }) => ({
  chat: one(chats, {
    fields: [chatPersonas.chatId],
    references: [chats.id],
  }),
  persona: one(personas, {
    fields: [chatPersonas.personaId],
    references: [personas.id],
  }),
  personaVersion: one(personaVersions, {
    fields: [chatPersonas.personaVersionId],
    references: [personaVersions.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  parent: one(messages, {
    fields: [messages.parentId],
    references: [messages.id],
  }),
  children: many(messages),
  images: many(images),
}));

export const imageGenerationsRelations = relations(
  imageGenerations,
  ({ one, many }) => ({
    persona: one(personas, {
      fields: [imageGenerations.personaId],
      references: [personas.id],
    }),
    user: one(users, {
      fields: [imageGenerations.userId],
      references: [users.id],
    }),

    image: one(images, {
      fields: [imageGenerations.imageId],
      references: [images.id],
    }),
  })
);

export const imagesRelations = relations(images, ({ one }) => ({
  persona: one(personas, {
    fields: [images.personaId],
    references: [personas.id],
  }),
  message: one(messages, {
    fields: [images.messageId],
    references: [messages.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  personaTags: many(personaTags),
}));

export const personaTagsRelations = relations(personaTags, ({ one }) => ({
  persona: one(personas, {
    fields: [personaTags.personaId],
    references: [personas.id],
  }),
  tag: one(tags, {
    fields: [personaTags.tagId],
    references: [tags.id],
  }),
}));

export const userTokensRelations = relations(userTokens, ({ one, many }) => ({
  user: one(users, {
    fields: [userTokens.userId],
    references: [users.id],
  }),
  transactions: many(tokenTransactions),
}));

export const tokenTransactionsRelations = relations(
  tokenTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [tokenTransactions.userId],
      references: [users.id],
    }),
  })
);
