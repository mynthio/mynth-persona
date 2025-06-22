// import "server-only";

import {
  integer,
  text,
  boolean,
  pgTable,
  timestamp,
  jsonb,
  varchar,
  foreignKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table - references Clerk auth
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Use Clerk user ID directly
  polarCustomerId: varchar("polar_customer_id", { length: 255 }), // Polar customer ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Personas table - basic metadata only
export const personas = pgTable("personas", {
  id: text("id").primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  currentVersionId: text("current_version_id"),
  profileImageId: text("profile_image_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Persona versions - actual persona data and versions
export const personaVersions = pgTable("persona_versions", {
  id: text("id").primaryKey(),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),
  title: text("title"),
  versionNumber: integer("version_number").notNull(), // For ordering and display
  personaData: jsonb("persona_data").notNull(), // Generated persona JSON data
  aiModel: varchar("ai_model", { length: 100 }).notNull(), // AI model used
  systemPromptId: varchar("system_prompt_id", { length: 100 }).notNull(), // System prompt identifier
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Suggestion: Define an enum for event types for better type safety.
export const eventTypeEnum = pgEnum("event_type_enum", [
  "persona_create",
  "persona_edit",
  "image_generate",
  "persona_revert",
  "persona_clone",
]);

// Events table - pure chat/interaction timeline
export const personaEvents = pgTable("persona_events", {
  id: text("id").primaryKey(),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventType: eventTypeEnum("event_type").notNull(), // 'generation', 'edit', 'image', 'revert'
  versionId: text("version_id").references(() => personaVersions.id, {
    onDelete: "set null",
  }), // Link to version (only for generation/edit)
  userMessage: text("user_message"), // User's input message
  aiNote: text("ai_note"), // AI's note/response for chat display
  tokensCost: integer("tokens_cost").notNull().default(0), // Tokens spent on this operation
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Images table - tracks generated images for gallery
export const images = pgTable("images", {
  id: text("id").primaryKey(),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventId: text("event_id").references(() => personaEvents.id, {
    onDelete: "set null",
  }), // Optional link to generation event
  url: text("url").notNull(),
  altText: text("alt_text"),
  aiModel: varchar("ai_model", { length: 100 }).notNull(),
  systemPromptId: varchar("system_prompt_id", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ratings table - user feedback on generations
export const ratings = pgTable("ratings", {
  id: text("id").primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventId: text("event_id")
    .notNull()
    .references(() => personaEvents.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // e.g., 1 for bad, 5 for good, or boolean 0/1
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  type: varchar("type", { length: 20 }).notNull(), // 'purchase'
  amount: integer("amount").notNull(), // Positive for add, negative for spend
  balanceAfter: integer("balance_after").notNull(), // Balance after this transaction
  orderId: varchar("order_id", { length: 255 }), // Stripe/payment provider ID
  checkoutId: varchar("checkout_id", { length: 255 }), // Polar checkout ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for better querying
export const usersRelations = relations(users, ({ one, many }) => ({
  personas: many(personas),
  events: many(personaEvents),
  images: many(images),
  ratings: many(ratings),
  tokens: one(userTokens),
  tokenTransactions: many(tokenTransactions),
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
  versions: many(personaVersions),
  events: many(personaEvents),
  images: many(images),
  profileImage: one(images, {
    fields: [personas.profileImageId],
    references: [images.id],
  }),
}));

export const personaVersionsRelations = relations(
  personaVersions,
  ({ one, many }) => ({
    persona: one(personas, {
      fields: [personaVersions.personaId],
      references: [personas.id],
    }),
    events: many(personaEvents),
  })
);

export const personaEventsRelations = relations(
  personaEvents,
  ({ one, many }) => ({
    persona: one(personas, {
      fields: [personaEvents.personaId],
      references: [personas.id],
    }),
    user: one(users, {
      fields: [personaEvents.userId],
      references: [users.id],
    }),
    version: one(personaVersions, {
      fields: [personaEvents.versionId],
      references: [personaVersions.id],
    }),
    ratings: many(ratings),
    images: many(images),
  })
);

export const imagesRelations = relations(images, ({ one }) => ({
  persona: one(personas, {
    fields: [images.personaId],
    references: [personas.id],
  }),
  user: one(users, {
    fields: [images.userId],
    references: [users.id],
  }),
  event: one(personaEvents, {
    fields: [images.eventId],
    references: [personaEvents.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  event: one(personaEvents, {
    fields: [ratings.eventId],
    references: [personaEvents.id],
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
