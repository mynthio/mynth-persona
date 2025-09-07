"use client";

import { PlanetIcon, ShootingStarIcon } from "@phosphor-icons/react/dist/ssr";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import { usePublicPersonasQuery } from "@/app/_queries/use-public-personas.query";
import { useUserPersonasQuery } from "@/app/_queries/use-user-personas.query";
import { getImageUrl } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Search } from "./ui/search";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link } from "./ui/link";

export function SidebarContentRouter() {
  const { view } = useSidebar();

  const getContentComponent = () => {
    switch (view) {
      case "personas":
        return <SidebarPersonasContent />;
      case "chats":
        return <SidebarChatsContent />;
      case "images":
        return <SidebarImagesContent />;
      default:
        return <SidebarPersonasContent />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
        className="h-full w-full md:flex"
      >
        {getContentComponent()}
      </motion.div>
    </AnimatePresence>
  );
}

function SidebarPersonasContent() {
  return (
    <SidebarContent className="gap-0">
      <SidebarGroup className="mt-[8px]">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={"/personas"} className="h-[38px] text-[16px]">
                  <PlanetIcon />
                  <span>Universe</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={"/"} className="h-[38px] text-[16px]">
                  <ShootingStarIcon />
                  <span>New Persona</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <PersonasList />
    </SidebarContent>
  );
}

function PersonasList() {
  const [query, setQuery] = useState("");

  const { data, isLoading } = useUserPersonasQuery({
    q: query,
  });

  // if (!data) return null;

  return (
    <>
      <SidebarGroup className="mb-0 pb-0">
        <SidebarMenu className="w-full min-w-0">
          <SidebarMenuItem className="w-full min-w-0 mb-[8px]">
            <Search placeholder="Search" onSearchChange={setQuery} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <ScrollArea className="h-full w-full min-h-0 min-w-0 grow-0 max-w-full">
        <SidebarGroup className="w-full min-w-0 mt-0 pt-0">
          <SidebarMenu>
            {data?.data.map((item) => (
              <SidebarMenuItem
                key={item.id}
                className="w-full overflow-hidden min-w-0"
              >
                <SidebarMenuButton asChild>
                  <Link
                    prefetch={false}
                    href={`/?persona_id=${item.id}`}
                    className="w-full min-w-0 max-w-full overflow-hidden truncate"
                  >
                    {item.profileImageId ? (
                      <img
                        className="size-[20px] rounded-[6px] shrink-0"
                        src={getImageUrl(
                          item.profileImageId ?? undefined,
                          "thumb"
                        )}
                        alt={item.title}
                      />
                    ) : (
                      <div className="size-[20px] rounded-[6px] bg-surface/10 shrink-0"></div>
                    )}
                    <span className="block truncate grow-0 w-full max-w-full">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </ScrollArea>
    </>
  );
}

function SidebarChatsContent() {
  return (
    <SidebarContent>
      <SidebarGroup>Chats</SidebarGroup>
    </SidebarContent>
  );
}

function SidebarImagesContent() {
  return (
    <SidebarContent>
      <SidebarGroup>Images</SidebarGroup>
    </SidebarContent>
  );
}
