import { getPaginatedScenarios } from "@/services/scenarios/get-paginated-scenarios";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const cursorCreatedAtParam = url.searchParams.get("cursorCreatedAt");
  const cursorIdParam = url.searchParams.get("cursorId");

  // Parse cursor if both params are present
  let cursor:
    | {
        id: string;
        createdAt: Date;
      }
    | undefined;
  if (cursorCreatedAtParam && cursorIdParam) {
    const createdAtDate = new Date(cursorCreatedAtParam);
    if (isNaN(createdAtDate.getTime())) {
      return new Response("Invalid cursorCreatedAt format", { status: 400 });
    }
    cursor = { id: cursorIdParam, createdAt: createdAtDate };
  }

  const result = await getPaginatedScenarios({ userId, cursor });

  return Response.json(result);
}
