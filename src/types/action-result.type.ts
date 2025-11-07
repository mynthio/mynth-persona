/**
 * Standard return type for server actions
 * Following Next.js best practices: return error objects instead of throwing
 * https://nextjs.org/docs/app/getting-started/error-handling
 */
export type ActionResult<T = void> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };
