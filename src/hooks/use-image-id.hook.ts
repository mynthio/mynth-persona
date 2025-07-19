import { useQueryState } from "nuqs";

// Search param for opening the image modal
// Example: ?image_id=img_123
export const useImageId = () => {
  return useQueryState("image_id");
};
