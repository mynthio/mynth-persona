import z from "zod/v4";

export const CUSTOM_PROPERTY_NAME_MAX_LENGTH = 64;

export const personaBuiltInPropertyNamesSchema = z.enum([
  "name",
  "age",
  "gender",
  "appearance",
  "personality",
  "background",
  "summary",
  "occupation",
]);

export const personaExtensionsPropertyNameSchema = z.literal("extensions");

export const personaExtendableBuiltInPropertyNamesSchema =
  personaBuiltInPropertyNamesSchema.extract([
    "appearance",
    "background",
    "personality",
    "occupation",
  ]);

export const personaNonExtendableBuiltInPropertyNamesSchema =
  personaBuiltInPropertyNamesSchema.exclude(
    personaExtendableBuiltInPropertyNamesSchema.options
  );

export const personaCustomPropertyNameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/)
  .max(CUSTOM_PROPERTY_NAME_MAX_LENGTH);

export const personaPropertyNameSchema = z.union([
  personaBuiltInPropertyNamesSchema,
  personaCustomPropertyNameSchema,
  personaExtensionsPropertyNameSchema,
]);

export const personaNewCustomPropertyNameSchema =
  personaCustomPropertyNameSchema.refine(
    (property) =>
      !personaNonExtendableBuiltInPropertyNamesSchema.options.includes(
        property as any
      ),
    {
      message: "Property is not a non-extendable built-in property",
    }
  );
