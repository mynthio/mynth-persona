CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'expired');--> statement-breakpoint
ALTER TABLE "token_transactions" ADD COLUMN "status" "transaction_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_transactions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_name" varchar(255);--> statement-breakpoint
ALTER TABLE "token_transactions" DROP COLUMN "order_id";--> statement-breakpoint
ALTER TABLE "token_transactions" DROP COLUMN "checkout_id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");