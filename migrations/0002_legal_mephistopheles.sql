ALTER TABLE "image_generations" DROP CONSTRAINT "image_generations_event_id_persona_events_id_fk";
--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "is_nsfw" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "image_generations" DROP COLUMN "event_id";