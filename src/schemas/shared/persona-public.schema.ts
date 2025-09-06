import { z } from "zod";
import { publicPersonaVersionSchema } from "./persona.schema";

// Enums duplicated for shared/public typing safety (frontend-safe)
export const nsfwRatingEnumSchema = z.enum(["sfw", "suggestive", "explicit"]);
export const genderEnumSchema = z.enum(["female", "male", "other"]);
export const ageBucketEnumSchema = z.enum([
  "unknown",
  "0-5",
  "6-12",
  "13-17",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65-plus",
]);

// Public persona list item schema for browse/search pages
export const publicPersonaListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  publicName: z.string(),
  headline: z.string(),
  profileImageId: z.string(),
  nsfwRating: nsfwRatingEnumSchema,
  gender: genderEnumSchema,
  ageBucket: ageBucketEnumSchema,
  likesCount: z.number(),
  publishedAt: z.date(),
});

export type PublicPersonaListItem = z.infer<typeof publicPersonaListItemSchema>;
