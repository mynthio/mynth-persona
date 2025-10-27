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
  numeric,
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

// Media-specific enums
export const mediaVisibilityEnum = pgEnum("media_visibility", [
  "private",
  "public",
  "deleted",
]);

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const mediaGenerationStatusEnum = pgEnum("media_generation_status", [
  "pending",
  "success",
  "fail",
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

export const scenarioStatusEnum = pgEnum("scenario_status", [
  "official",
  "community",
  "verified",
]);

export const personaStatusEnum = pgEnum("persona_status", [
  "official",
  "community",
  "verified",
]);

export const roleTypeEnum = pgEnum("role_type_enum", [
  "default",
  "suggested",
  "featured",
  "primary",
]);

export const scenarioContentRatingEnum = pgEnum("scenario_content_rating", [
  "everyone",
  "teen",
  "mature",
  "adult",
]);

export const scenarioPublishStatusEnum = pgEnum("scenario_publish_status", [
  "pending",
  "success",
  "error",
  "flagged",
]);

export const scenarioPersonaSourceEnum = pgEnum("scenario_persona_source", [
  "author",
  "community",
]);

// Users table - references Clerk auth
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    // Optional username, must be unique when present
    username: varchar("username", { length: 255 }),
    // Clerk image URL
    imageUrl: text("image_url"),
    // Display name, defaults to username in webhook
    displayName: varchar("display_name", { length: 255 }),
    // Plan mirror (Clerk is source of truth). Default to 'free'.
    plan: text("plan").notNull().default("free"),
    // Optional expiration for analytics/fallbacks
    planExpiresAt: timestamp("plan_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique("users_username_unique").on(t.username)]
);

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
    // New media-based profile fields (nullable to avoid impacting existing data)
    profileImageIdMedia: text("profile_image_media_id").references(
      () => media.id,
      {
        onDelete: "set null",
      }
    ),
    profileSpotlightMediaId: text("profile_spotlight_media_id").references(
      () => media.id,
      { onDelete: "set null" }
    ),

    visibility: personaVisibilityEnum("visibility")
      .notNull()
      .default("private"),
    status: personaStatusEnum("status").notNull().default("community"),
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
    event: varchar("event", { length: 50 }),
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

// Media generations - generic generation jobs for media (image/video)
export const mediaGenerations = pgTable(
  "media_generations",
  {
    id: text("id").primaryKey(),
    metadata: jsonb("metadata"),
    settings: jsonb("settings"),
    cost: integer("cost").notNull().default(0),
    status: mediaGenerationStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [index("media_generations_status_idx").on(t.status)]
);

// Media table - unified storage for images and videos
export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey(),
    personaId: text("persona_id")
      .notNull()
      .references((): AnyPgColumn => personas.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    generationId: text("generation_id").references(() => mediaGenerations.id, {
      onDelete: "set null",
    }),
    visibility: mediaVisibilityEnum("visibility").notNull().default("private"),
    metadata: jsonb("metadata"),
    type: mediaTypeEnum("type").notNull(),
    nsfw: nsfwRatingEnum("nsfw").notNull().default("sfw"),
    // Reaction and engagement aggregates for filtering and sorting
    likesCount: integer("likes_count").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    votesUp: integer("votes_up").notNull().default(0),
    votesDown: integer("votes_down").notNull().default(0),
    ratingAveragePercentage: smallint("rating_average_percentage")
      .notNull()
      .default(0), // 0-100 percentage for average rating
    // Publishing anonymity flag
    isCreatorAnonymous: boolean("is_creator_anonymous")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("media_persona_id_idx").on(t.personaId),
    index("media_user_id_idx").on(t.userId),
    index("media_visibility_idx").on(t.visibility),
    index("media_type_idx").on(t.type),
    index("media_likes_count_idx").on(t.likesCount),
    index("media_comments_count_idx").on(t.commentsCount),
    index("media_votes_up_idx").on(t.votesUp),
    index("media_votes_down_idx").on(t.votesDown),
    index("media_rating_average_percentage_idx").on(t.ratingAveragePercentage),
    check(
      "media_rating_average_percentage_check",
      sql`${t.ratingAveragePercentage} >= 0 AND ${t.ratingAveragePercentage} <= 100`
    ),
  ]
);

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

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "failed",
  "expired",
]);

// Token transactions - complete audit trail (NO CASCADE - preserve for accounting)
export const tokenTransactions = pgTable("token_transactions", {
  id: text("id").primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id), // NO CASCADE - preserve audit trail
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").notNull().default("pending"),
  amount: integer("amount").notNull(), // Positive for add, negative for spend
  balanceAfter: integer("balance_after").notNull(), // Balance after this transaction
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Scenarios table - reusable scenario templates for chats
export const scenarios = pgTable(
  "scenarios",
  {
    id: text("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    content: jsonb("content").notNull(), // {"scenario_text": "...", "user_persona_text": "...", "starting_messages": [...], "style_guidelines": "...", "system_prompt_override": "...", "suggested_user_name": "..."}
    tags: text("tags").array(), // Array of tag strings
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    backgroundImageUrl: varchar("background_image_url", { length: 255 }),
    visibility: personaVisibilityEnum("visibility")
      .notNull()
      .default("private"),
    status: scenarioStatusEnum("status").notNull().default("community"),
    contentRating: scenarioContentRatingEnum("content_rating")
      .notNull()
      .default("everyone"),
    suggestedAiModels: jsonb("suggested_ai_models"),
    ratingsAvg: numeric("ratings_avg", { precision: 3, scale: 2 })
      .notNull()
      .default("0.00"),
    ratingsCount: integer("ratings_count").notNull().default(0),
    usageCount: integer("usage_count").notNull().default(0),
    reportCount: integer("report_count").notNull().default(0),
    lastUsedAt: timestamp("last_used_at"),
    creatorId: varchar("creator_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    verifiedBy: varchar("verified_by", { length: 255 }).references(
      () => users.id,
      { onDelete: "set null" }
    ),
    verifiedAt: timestamp("verified_at"),
    preferredGroupMembers: integer("preferred_group_members")
      .notNull()
      .default(1),
    publishStatus: scenarioPublishStatusEnum("publish_status"),
    lastPublishAttempt: jsonb("last_publish_attempt"),
    deletedAt: timestamp("deleted_at"),
    event: varchar("event", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("scenarios_visibility_idx").on(t.visibility),
    index("scenarios_status_idx").on(t.status),
    index("scenarios_creator_id_idx").on(t.creatorId),
    index("scenarios_content_rating_idx").on(t.contentRating),
  ]
);

// Scenario-Personas junction table - links personas to scenarios with roles
export const scenarioPersonas = pgTable(
  "scenario_personas",
  {
    scenarioId: text("scenario_id")
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    personaId: text("persona_id")
      .notNull()
      .references(() => personas.id, { onDelete: "cascade" }),
    roleType: roleTypeEnum("role_type").notNull().default("suggested"),
    source: scenarioPersonaSourceEnum("source").notNull().default("author"),
    metadata: jsonb("metadata"), // Generic flexible field, e.g., {"order": 1, "required": true}
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.scenarioId, t.personaId] }),
    index("scenario_personas_role_type_idx").on(t.roleType),
  ]
);


// Ratings table - user ratings for scenarios
export const ratings = pgTable(
  "ratings",
  {
    id: text("id").primaryKey(),
    scenarioId: text("scenario_id")
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("ratings_scenario_user_unique").on(t.scenarioId, t.userId),
    check("ratings_rating_check", sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
    index("ratings_scenario_id_idx").on(t.scenarioId),
  ]
);

// Relations for better querying
export const usersRelations = relations(users, ({ many }) => ({
  personas: many(personas),
  chats: many(chats),
  createdScenarios: many(scenarios),
  ratings: many(ratings),
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
  profileImageMedia: one(media, {
    fields: [personas.profileImageIdMedia],
    references: [media.id],
  }),
  profileSpotlightMedia: one(media, {
    fields: [personas.profileSpotlightMediaId],
    references: [media.id],
  }),
  personaTags: many(personaTags),
  scenarioPersonas: many(scenarioPersonas),
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
  ({ one }) => ({
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

export const mediaGenerationsRelations = relations(
  mediaGenerations,
  ({ many }) => ({
    media: many(media),
  })
);

// Media reactions: votes (thumbs up/down), likes (saves), comments
export const mediaVotes = pgTable(
  "media_votes",
  {
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isUpvote: boolean("is_upvote").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.mediaId, t.userId] }),
    index("media_votes_is_upvote_idx").on(t.isUpvote),
  ]
);

export const mediaComments = pgTable(
  "media_comments",
  {
    id: text("id").primaryKey(),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("media_comments_media_id_idx").on(t.mediaId),
    index("media_comments_user_id_idx").on(t.userId),
  ]
);

export const mediaLikes = pgTable(
  "media_likes",
  {
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.mediaId, t.userId] }),
    index("media_likes_user_id_idx").on(t.userId),
  ]
);

export const mediaRelations = relations(media, ({ one, many }) => ({
  persona: one(personas, {
    fields: [media.personaId],
    references: [personas.id],
  }),
  user: one(users, {
    fields: [media.userId],
    references: [users.id],
  }),
  generation: one(mediaGenerations, {
    fields: [media.generationId],
    references: [mediaGenerations.id],
  }),
  votes: many(mediaVotes),
  likes: many(mediaLikes),
  comments: many(mediaComments),
}));

export const mediaVotesRelations = relations(mediaVotes, ({ one }) => ({
  media: one(media, {
    fields: [mediaVotes.mediaId],
    references: [media.id],
  }),
  user: one(users, {
    fields: [mediaVotes.userId],
    references: [users.id],
  }),
}));

export const mediaCommentsRelations = relations(mediaComments, ({ one }) => ({
  media: one(media, {
    fields: [mediaComments.mediaId],
    references: [media.id],
  }),
  user: one(users, {
    fields: [mediaComments.userId],
    references: [users.id],
  }),
}));

export const mediaLikesRelations = relations(mediaLikes, ({ one }) => ({
  media: one(media, {
    fields: [mediaLikes.mediaId],
    references: [media.id],
  }),
  user: one(users, {
    fields: [mediaLikes.userId],
    references: [users.id],
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

export const scenariosRelations = relations(scenarios, ({ one, many }) => ({
  creator: one(users, {
    fields: [scenarios.creatorId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [scenarios.verifiedBy],
    references: [users.id],
  }),
  scenarioPersonas: many(scenarioPersonas),
  ratings: many(ratings),
}));

export const scenarioPersonasRelations = relations(
  scenarioPersonas,
  ({ one }) => ({
    scenario: one(scenarios, {
      fields: [scenarioPersonas.scenarioId],
      references: [scenarios.id],
    }),
    persona: one(personas, {
      fields: [scenarioPersonas.personaId],
      references: [personas.id],
    }),
  })
);


export const ratingsRelations = relations(ratings, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [ratings.scenarioId],
    references: [scenarios.id],
  }),
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
}));
