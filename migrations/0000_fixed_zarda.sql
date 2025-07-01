CREATE TYPE "public"."image_generation_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."persona_event_type_enum" AS ENUM('persona_create', 'persona_edit', 'image_generate', 'persona_revert', 'persona_clone');--> statement-breakpoint
CREATE TYPE "public"."transaction_type_enum" AS ENUM('purchase', 'refund');--> statement-breakpoint
CREATE TABLE "image_generations" (
	"id" text PRIMARY KEY NOT NULL,
	"persona_id" text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"event_id" text NOT NULL,
	"run_id" varchar(255),
	"prompt" text NOT NULL,
	"ai_model" varchar(255) NOT NULL,
	"status" "image_generation_status_enum" DEFAULT 'pending' NOT NULL,
	"tokens_cost" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"settings" jsonb,
	"metadata" jsonb,
	"image_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" text PRIMARY KEY NOT NULL,
	"persona_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona_events" (
	"id" text PRIMARY KEY NOT NULL,
	"persona_id" text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "persona_event_type_enum" NOT NULL,
	"version_id" text,
	"user_message" text,
	"error_message" text,
	"ai_note" text,
	"tokens_cost" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"persona_id" text NOT NULL,
	"title" text,
	"version_number" integer NOT NULL,
	"data" jsonb NOT NULL,
	"changed_properties" text[],
	"ai_model" varchar(255) NOT NULL,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" text,
	"current_version_id" text,
	"profile_image_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "transaction_type_enum" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"order_id" varchar(255),
	"checkout_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_tokens" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"daily_tokens_used" integer DEFAULT 0 NOT NULL,
	"last_daily_reset" timestamp,
	"total_purchased" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_generations" ADD CONSTRAINT "image_generations_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generations" ADD CONSTRAINT "image_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generations" ADD CONSTRAINT "image_generations_event_id_persona_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."persona_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generations" ADD CONSTRAINT "image_generations_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_events" ADD CONSTRAINT "persona_events_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_events" ADD CONSTRAINT "persona_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_events" ADD CONSTRAINT "persona_events_version_id_persona_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."persona_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_versions" ADD CONSTRAINT "persona_versions_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_transactions" ADD CONSTRAINT "token_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "persona_events_persona_id_idx" ON "persona_events" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "personas_user_id_idx" ON "personas" USING btree ("user_id");