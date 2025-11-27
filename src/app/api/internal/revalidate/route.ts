import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

/**
 * Internal Route Handler for cache revalidation.
 * Called by background jobs (e.g., Trigger.dev tasks) that cannot call revalidateTag directly.
 *
 * Security: Requires INTERNAL_REVALIDATION_SECRET in Authorization header.
 */
export async function POST(request: NextRequest) {
  // Verify internal secret
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.INTERNAL_REVALIDATION_SECRET;

  if (!expectedSecret) {
    console.error("INTERNAL_REVALIDATION_SECRET not configured");
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  const body = await request.json().catch(() => null);

  if (!body || typeof body.tag !== "string") {
    return Response.json(
      { error: "Missing or invalid 'tag' in request body" },
      { status: 400 }
    );
  }

  const { tag } = body;

  // Validate tag format
  if (tag.length === 0 || tag.length > 256) {
    return Response.json(
      { error: "Tag must be between 1 and 256 characters" },
      { status: 400 }
    );
  }

  // Revalidate with stale-while-revalidate semantics
  revalidateTag(tag, "max");

  return Response.json({
    revalidated: true,
    tag,
    timestamp: Date.now(),
  });
}
