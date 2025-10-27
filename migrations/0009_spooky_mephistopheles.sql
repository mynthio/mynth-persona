CREATE TYPE "public"."persona_status" AS ENUM('official', 'community', 'verified');--> statement-breakpoint
CREATE TYPE "public"."role_type_enum" AS ENUM('default', 'suggested', 'featured', 'primary');--> statement-breakpoint
CREATE TYPE "public"."scenario_content_rating" AS ENUM('everyone', 'teen', 'mature', 'adult');--> statement-breakpoint
CREATE TYPE "public"."scenario_persona_source" AS ENUM('author', 'community');--> statement-breakpoint
CREATE TYPE "public"."scenario_publish_status" AS ENUM('pending', 'success', 'error', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."scenario_status" AS ENUM('official', 'community', 'verified');--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"scenario_id" text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_scenario_user_unique" UNIQUE("scenario_id","user_id"),
	CONSTRAINT "ratings_rating_check" CHECK ("ratings"."rating" >= 1 AND "ratings"."rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "scenario_personas" (
	"scenario_id" text NOT NULL,
	"persona_id" text NOT NULL,
	"role_type" "role_type_enum" DEFAULT 'suggested' NOT NULL,
	"source" "scenario_persona_source" DEFAULT 'author' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scenario_personas_scenario_id_persona_id_pk" PRIMARY KEY("scenario_id","persona_id")
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"content" jsonb NOT NULL,
	"tags" text[],
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"background_image_url" varchar(255),
	"visibility" "persona_visibility" DEFAULT 'private' NOT NULL,
	"status" "scenario_status" DEFAULT 'community' NOT NULL,
	"content_rating" "scenario_content_rating" DEFAULT 'everyone' NOT NULL,
	"suggested_ai_models" jsonb,
	"ratings_avg" numeric(3, 2) DEFAULT '0.00' NOT NULL,
	"ratings_count" integer DEFAULT 0 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"creator_id" varchar(255) NOT NULL,
	"verified_by" varchar(255),
	"verified_at" timestamp,
	"preferred_group_members" integer DEFAULT 1 NOT NULL,
	"publish_status" "scenario_publish_status",
	"last_publish_attempt" jsonb,
	"deleted_at" timestamp,
	"event" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "status" "persona_status" DEFAULT 'community' NOT NULL;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "event" varchar(50);--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_personas" ADD CONSTRAINT "scenario_personas_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_personas" ADD CONSTRAINT "scenario_personas_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ratings_scenario_id_idx" ON "ratings" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "scenario_personas_role_type_idx" ON "scenario_personas" USING btree ("role_type");--> statement-breakpoint
CREATE INDEX "scenarios_visibility_idx" ON "scenarios" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "scenarios_status_idx" ON "scenarios" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scenarios_creator_id_idx" ON "scenarios" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "scenarios_content_rating_idx" ON "scenarios" USING btree ("content_rating");