ALTER TABLE "media" DROP CONSTRAINT "media_persona_id_personas_id_fk";
--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "persona_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE set null ON UPDATE no action;