import { getPaginatedScenarios } from "@/services/scenarios/get-paginated-scenarios";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { userId } = await auth();

  const url = new URL(request.url);
  const cursorCreatedAtParam = url.searchParams.get("cursorCreatedAt");
  const cursorIdParam = url.searchParams.get("cursorId");
  const eventParam = url.searchParams.get("event");

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

  const result = await getPaginatedScenarios({
    userId,
    cursor,
    event: eventParam || undefined,
  });

  return Response.json(result);
}
