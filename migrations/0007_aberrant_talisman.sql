CREATE TYPE "public"."media_generation_status" AS ENUM('pending', 'success', 'fail');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."media_visibility" AS ENUM('private', 'public', 'deleted');--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"persona_id" text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"generation_id" text,
	"visibility" "media_visibility" DEFAULT 'private' NOT NULL,
	"metadata" jsonb,
	"type" "media_type" NOT NULL,
	"nsfw" "nsfw_rating" DEFAULT 'sfw' NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"votes_up" integer DEFAULT 0 NOT NULL,
	"votes_down" integer DEFAULT 0 NOT NULL,
	"rating_average_percentage" smallint DEFAULT 0 NOT NULL,
	"is_creator_anonymous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_rating_average_percentage_check" CHECK ("media"."rating_average_percentage" >= 0 AND "media"."rating_average_percentage" <= 100)
);
--> statement-breakpoint
CREATE TABLE "media_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"media_id" text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_generations" (
	"id" text PRIMARY KEY NOT NULL,
	"metadata" jsonb,
	"settings" jsonb,
	"cost" integer DEFAULT 0 NOT NULL,
	"status" "media_generation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "media_likes" (
	"media_id" text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_likes_media_id_user_id_pk" PRIMARY KEY("media_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "media_votes" (
	"media_id" text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"is_upvote" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_votes_media_id_user_id_pk" PRIMARY KEY("media_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "profile_image_media_id" text;--> statement-breakpoint
ALTER TABLE "personas" ADD COLUMN "profile_spotlight_media_id" text;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_generation_id_media_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."media_generations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_comments" ADD CONSTRAINT "media_comments_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_comments" ADD CONSTRAINT "media_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_likes" ADD CONSTRAINT "media_likes_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_likes" ADD CONSTRAINT "media_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_votes" ADD CONSTRAINT "media_votes_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_votes" ADD CONSTRAINT "media_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_persona_id_idx" ON "media" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "media_user_id_idx" ON "media" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_visibility_idx" ON "media" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "media_type_idx" ON "media" USING btree ("type");--> statement-breakpoint
CREATE INDEX "media_likes_count_idx" ON "media" USING btree ("likes_count");--> statement-breakpoint
CREATE INDEX "media_comments_count_idx" ON "media" USING btree ("comments_count");--> statement-breakpoint
CREATE INDEX "media_votes_up_idx" ON "media" USING btree ("votes_up");--> statement-breakpoint
CREATE INDEX "media_votes_down_idx" ON "media" USING btree ("votes_down");--> statement-breakpoint
CREATE INDEX "media_rating_average_percentage_idx" ON "media" USING btree ("rating_average_percentage");--> statement-breakpoint
CREATE INDEX "media_comments_media_id_idx" ON "media_comments" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "media_comments_user_id_idx" ON "media_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_generations_status_idx" ON "media_generations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "media_likes_user_id_idx" ON "media_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_votes_is_upvote_idx" ON "media_votes" USING btree ("is_upvote");--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_profile_image_media_id_media_id_fk" FOREIGN KEY ("profile_image_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_profile_spotlight_media_id_media_id_fk" FOREIGN KEY ("profile_spotlight_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;