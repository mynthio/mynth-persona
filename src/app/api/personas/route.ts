import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const _personas = await db.query.personas.findMany({
    where: eq(personas.userId, userId),
    columns: {
      id: true,
      title: true,
      currentVersionId: true,
      profileImageId: true,
      createdAt: true,
    },
    orderBy: desc(personas.createdAt),
  });

  return Response.json(_personas);
}
