# PERSONA-2 — MVP TODO (Phase 1: Core Infrastructure)

Goal: Implement the minimum backend infrastructure to publish personas publicly via AI pipeline, without discovery UI.

## 1) Drizzle schema changes (src/db/schema.ts)

- [x] Define pgEnum types: persona_visibility, nsfw_rating, persona_gender, persona_age_bucket
- [x] Extend personas table: visibility, publicVersionId (FK), nsfwRating, gender, headline, publicName, publicAge (int, default -1), ageBucket, likesCount (0), publishedAt, deletedAt, slug (unique), lastPublishAttempt (jsonb)
- [x] Define new tables: tags, persona_tags (PK, FKs, confidence check 0–100)
- [x] Add indexes in schema: personas(visibility), personas(nsfwRating), personas(gender)
- [x] Ensure sane defaults and NOT NULLs where specified (no manual SQL backfill; rely on generated migration)

## 2) ORM (Drizzle) schema updates

- [x] Update src/db/schema.ts with new enums, columns, relations
- [x] Add tags and persona_tags models and relations

## 3) Seed predefined tags

- [x] Add seed script (scripts/seed-tags.ts) to insert predefined tags (lowercase, category, sortOrder)
- [x] Idempotent upsert behavior

## 4) Publish workflow

- [x] New action: src/actions/publish-persona.action.ts
  - Validations: owner, not deleted, not already public with locked publicVersionId
  - Set lastPublishAttempt.status='pending' and enqueue job
- [ ] New Trigger task: src/trigger/publish-persona.task.ts
  - Read persona + selected version; lock publicVersionId
  - AI: generate tags (+confidence), nsfwRating, gender, numeric age, ageBucket, headline
  - Cache publicName/publicAge; generate unique slug (name + headline + nanoid(6))
  - Insert persona_tags; update persona fields; set visibility='public', publishedAt=NOW()
  - Update lastPublishAttempt with success or failure

## 5) AI helpers

- [ ] Prompts/utilities under src/lib/prompts and src/lib/transformers for: tag extraction, nsfw classification, gender, age parsing, headline generation

## 6) NSFW from image (MVP rule)

- [ ] On profile image change (src/actions/set-persona-profile-image.action.ts), set nsfwRating='explicit' if image.isNSFW=true; otherwise keep AI result

## 7) Permissions/immutability

- [ ] Prevent editing public personas’ published fields; enforce publicVersionId immutability

## 8) Logging and metrics

- [ ] Use lib/logger and logsnag for publish attempts (status, errors, runId)

## 9) Developer test hook (temporary)

- [ ] Add internal-only button/endpoint to trigger publish for a persona (behind dev flag)

Testing tips (manual):

- Run migration; seed tags; create a persona/version; trigger publish; verify persona rows, tags, enums, and visibility changes; try profile image change to test NSFW override.
