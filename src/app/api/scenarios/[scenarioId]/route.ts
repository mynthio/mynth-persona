import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { scenarios } from "@/db/schema";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/scenarios/[scenarioId]">
) {
  const { scenarioId } = await ctx.params;

  try {
    // Get current user (if logged in)
    const { userId } = await auth();

    // Build access control conditions:
    // - Public scenarios can be accessed by anyone
    // - Private scenarios can only be accessed by creator
    // - Deleted scenarios are never accessible
    const accessCondition = userId
      ? or(
          eq(scenarios.visibility, "public"),
          eq(scenarios.creatorId, userId)
        )
      : eq(scenarios.visibility, "public");

    // Fetch the scenario with creator information
    const scenario = await db.query.scenarios.findFirst({
      where: and(
        eq(scenarios.id, scenarioId),
        ne(scenarios.visibility, "deleted"),
        isNull(scenarios.deletedAt),
        accessCondition
      ),
      with: {
        creator: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            imageUrl: true,
          },
        },
        scenarioPersonas: {
          with: {
            persona: {
              columns: {
                id: true,
                slug: true,
                publicName: true,
                headline: true,
                profileImageIdMedia: true,
                gender: true,
                ageBucket: true,
              },
            },
          },
        },
      },
    });

    // Scenario not found or not accessible
    if (!scenario) {
      notFound();
    }

    // Check if user is the creator
    const isCreator = userId === scenario.creatorId;

    // Determine if creator info should be included
    // Don't return creator if: isAnonymous is true, scenario is public, and user is not creator
    const shouldIncludeCreator = !(
      scenario.isAnonymous &&
      scenario.visibility === "public" &&
      !isCreator
    );

    // Build response object with selected fields
    const response = {
      id: scenario.id,
      title: scenario.title,
      description: scenario.description,
      content: scenario.content,
      tags: scenario.tags,
      isAnonymous: scenario.isAnonymous,
      backgroundImageUrl: scenario.backgroundImageUrl,
      visibility: scenario.visibility,
      status: scenario.status,
      contentRating: scenario.contentRating,
      suggestedAiModels: scenario.suggestedAiModels,
      ratingsAvg: scenario.ratingsAvg,
      ratingsCount: scenario.ratingsCount,
      usageCount: scenario.usageCount,
      preferredGroupMembers: scenario.preferredGroupMembers,
      event: scenario.event,
      createdAt: scenario.createdAt,
      updatedAt: scenario.updatedAt,
      // Conditionally include creator info
      ...(shouldIncludeCreator && {
        creator: scenario.creator,
        creatorId: scenario.creatorId,
      }),
      // Include personas linked to this scenario
      personas: scenario.scenarioPersonas.map((sp) => ({
        roleType: sp.roleType,
        source: sp.source,
        persona: sp.persona,
      })),
      // Include if user is creator (for UI purposes)
      isCreator,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      {
        error,
        event: "fetch_scenario",
        component: "scenario_route",
        attributes: {
          route: "/api/scenarios/[scenarioId]",
          handler: "GET",
          scenario_id: scenarioId,
        },
      },
      "Error fetching scenario"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
