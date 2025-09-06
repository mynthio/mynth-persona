CREATE TYPE "public"."nsfw_rating" AS ENUM('sfw', 'suggestive', 'explicit');--> statement-breakpoint
CREATE TYPE "public"."persona_age_bucket" AS ENUM('unknown', '0-5', '6-12', '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65-plus');--> statement-breakpoint
CREATE TYPE "public"."persona_gender" AS ENUM('female', 'male', 'other');--> statement-breakpoint
CREATE TYPE "public"."persona_visibility" AS ENUM('private', 'public', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."tag_category" AS ENUM('appearance', 'personality', 'physical', 'age', 'style', 'other');--> statement-breakpoint
CREATE TABLE "persona_tags" (
	"persona_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"confidence" smallint DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "persona_tags_persona_id_tag_id_pk" PRIMARY KEY("persona_id","tag_id"),
	CONSTRAINT "persona_tags_confidence_check" CHECK ("persona_tags"."confidence" >= 0 AND "persona_tags"."confidence" <= 100)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"category" "tag_category" NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "visibility" "persona_visibility" DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "public_version_id" text;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "nsfw_rating" "nsfw_rating" DEFAULT 'sfw' NOT NULL;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "gender" "persona_gender" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "public_name" varchar(100);--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "age_bucket" "persona_age_bucket" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "likes_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "slug" varchar(200);--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "last_publish_attempt" jsonb;--> statement-breakpoint
ALTER TABLE "persona_tags" ADD CONSTRAINT "persona_tags_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_tags" ADD CONSTRAINT "persona_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "personas_visibility_idx" ON "personas" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "personas_nsfw_rating_idx" ON "personas" USING btree ("nsfw_rating");--> statement-breakpoint
CREATE INDEX "personas_gender_idx" ON "personas" USING btree ("gender");--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_slug_unique" UNIQUE("slug");