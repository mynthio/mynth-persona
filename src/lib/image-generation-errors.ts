/**
 * Error code to user-friendly message mapping for image generation errors
 */

const IMAGE_GENERATION_ERROR_MESSAGES: Record<string, string> = {
  CONTENT_MODERATED: "Content moderated",
  UNKNOWN_ERROR: "Failed to generate",
};

export function getImageGenerationErrorMessage(errorCode?: string): string {
  if (!errorCode) return IMAGE_GENERATION_ERROR_MESSAGES.UNKNOWN_ERROR;
  return IMAGE_GENERATION_ERROR_MESSAGES[errorCode] || IMAGE_GENERATION_ERROR_MESSAGES.UNKNOWN_ERROR;
}
