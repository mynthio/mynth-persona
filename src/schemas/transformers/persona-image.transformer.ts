import {
  PublicPersonaImage,
  publicPersonaImageSchema,
} from "@/schemas/shared/persona-image.schema";

export function transformToPublicPersonaImage(image: {
  id: string;
}): PublicPersonaImage {
  return publicPersonaImageSchema.parse({ id: image.id });
}

export function transformToPublicPersonaImages(
  images: Array<{ id: string }>
): PublicPersonaImage[] {
  return images.map(transformToPublicPersonaImage);
}
