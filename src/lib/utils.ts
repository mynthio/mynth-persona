import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getImageUrl = (
  imageId: string,
  variant: "full" | "thumb" = "full"
) => {
  const suffix = variant === "thumb" ? "_thumb" : "";
  return `${process.env.NEXT_PUBLIC_CDN_BASE_URL}/personas/${imageId}${suffix}.webp`;
};
