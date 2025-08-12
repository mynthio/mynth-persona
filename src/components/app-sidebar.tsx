import "server-only";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import {
  BookIcon,
  CoinsIcon,
  DiscordLogoIcon,
  GithubLogoIcon,
  InfoIcon,
  MoneyIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";

import Link from "next/link";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { Suspense } from "react";
import { TokensBalance } from "./tokens-balance";
import { AppSidebarHeader } from "./app-sidebar-header";
import { AppSidebarUser } from "./app-sidebar-user";
import { DISCORD_INVITE_URL, GITHUB_REPO_URL } from "@/lib/constants";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <AppSidebarHeader />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My Persona</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="creator">
                <SidebarMenuButton asChild>
                  <Link href="/" prefetch={false}>
                    <SparkleIcon weight="duotone" />
                    Generate
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem key="library">
                <SidebarMenuButton asChild>
                  <Link href="/library" prefetch={false}>
                    <BookIcon weight="duotone" />
                    Library
                  </Link>
                </SidebarMenuButton>
                <Suspense fallback={<RecentPersonasSkeleton />}>
                  <RecentPersonas />
                </Suspense>
              </SidebarMenuItem>
              <SidebarMenuItem key="tokens">
                <SidebarMenuButton asChild>
                  <Link href="/tokens" prefetch={false}>
                    <CoinsIcon weight="duotone" />
                    <span>Tokens</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge>
                  <TokensBalance />
                </SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/*
          A sidebar part with Persona app information 
        */}
        <SidebarGroup>
          <SidebarGroupLabel>More</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="about">
                <SidebarMenuButton asChild>
                  <Link href="/about" prefetch={false}>
                    <InfoIcon weight="duotone" />
                    <span>About</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem key="pricing">
                <SidebarMenuButton asChild>
                  <Link href="/pricing" prefetch={false}>
                    <MoneyIcon weight="duotone" />
                    <span>Pricing</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="discord">
                <SidebarMenuButton asChild>
                  <Link
                    href={DISCORD_INVITE_URL}
                    prefetch={false}
                    target="_blank"
                  >
                    <DiscordLogoIcon weight="duotone" />
                    <span>Discord</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem key="github">
                <SidebarMenuButton asChild>
                  <Link href={GITHUB_REPO_URL} prefetch={false} target="_blank">
                    <GithubLogoIcon weight="duotone" />
                    <span>GitHub</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <AppSidebarUser />
      </SidebarFooter>
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
      isNotNull(personas.currentVersionId)
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
