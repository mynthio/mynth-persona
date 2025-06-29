import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const _personas = await db.query.personas.findMany({
    where: eq(personas.userId, userId),
    with: {
      currentVersion: true,
      profileImage: true,
    },
    orderBy: desc(personas.createdAt),
  });

  logger.debug(_personas);

  return Response.json(_personas);
}
