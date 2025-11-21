ALTER TABLE "media" ADD COLUMN "published_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "media_published_at_idx" ON "media" USING btree ("published_at");