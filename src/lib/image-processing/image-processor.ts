import sharp, { FitEnum } from "sharp";
import { Effect } from "effect";

export type ImageVariant = {
  resize?: {
    width: number;
    height: number;
    fit?: keyof FitEnum;
    position?: string;
  };
  quality?: number;
};

export async function processImage(
  buffer: Buffer,
  variants: ImageVariant[]
): Promise<Buffer[]> {
  const processVariant = (variant: ImageVariant) =>
    Effect.promise(async () => {
      let img = sharp(buffer);
      if (variant.resize) {
        img = img.resize(variant.resize.width, variant.resize.height, {
          fit: variant.resize.fit || "cover",
          position: variant.resize.position || "centre",
        });
      }

      return await img
        .webp({ quality: variant.quality || 80, effort: 4 })
        .toBuffer();
    });

  const resultsEffect = Effect.forEach(variants, processVariant, {
    concurrency: "unbounded",
  });
  return Effect.runPromise(resultsEffect);
}
