ALTER TABLE "persona_events" DROP CONSTRAINT "persona_events_version_id_persona_versions_id_fk";
--> statement-breakpoint
ALTER TABLE "persona_events" ADD CONSTRAINT "persona_events_version_id_persona_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."persona_versions"("id") ON DELETE cascade ON UPDATE no action;