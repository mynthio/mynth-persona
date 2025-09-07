import "server-only";

import {
  Sidebar,
  SidebarContent,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

import Link from "next/link";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { SidebarContentRouter } from "./app-sidebar-content";

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas" className="left-[64px]">
      <SidebarContentRouter />
    </Sidebar>
  );
}

function RecentPersonasSkeleton() {
  return (
    <SidebarMenuSub>
      {Array.from({ length: 5 }).map((_, index) => (
        <SidebarMenuSubItem key={index}>
          <SidebarMenuSkeleton />
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}

async function RecentPersonas() {
  const { userId } = await auth();

  if (!userId) return null;

  const projects = await db.query.personas.findMany({
    where: and(
      eq(personas.userId, userId),
      isNotNull(personas.currentVersionId),
      ne(personas.visibility, "deleted")
    ),
    orderBy: desc(personas.createdAt),
    limit: 5,
  });

  if (projects.length === 0) return null;

  return (
    <SidebarMenuSub>
      {projects.map((persona) => (
        <SidebarMenuSubItem key={persona.id}>
          <SidebarMenuSubButton asChild>
            <Link
              href={`/?persona_id=${persona.id}&panel=true`}
              prefetch={false}
            >
              {persona.profileImageId ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_CDN_BASE_URL}/personas/${persona.profileImageId}_thumb.webp`}
                  width={16}
                  height={16}
                  loading="lazy"
                  className="rounded-[5px]"
                />
              ) : (
                <div className="flex-shrink-0 w-[16px] h-[16px] rounded-sm bg-gradient-to-br from-neutral-200 to-neutral-300" />
              )}
              <span>{persona.title}</span>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}
