DROP TABLE "persona_events" CASCADE;--> statement-breakpoint
ALTER TABLE "persona_versions" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "persona_versions" DROP COLUMN "changed_properties";--> statement-breakpoint
DROP TYPE "public"."persona_event_type_enum";