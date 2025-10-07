"use client";

import {
  ChatsTeardropIcon,
  CircleNotchIcon,
  FeatherIcon,
  PencilRulerIcon,
  PlanetIcon,
  ShootingStarIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

import { useUserPersonasQuery } from "@/app/_queries/use-user-personas.query";
import { getImageUrl } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Search } from "./ui/search";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "./ui/link";
import { usePathname } from "next/navigation";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useDebounce } from "@uidotdev/usehooks";
import { useUserChatsQuery } from "@/app/_queries/use-user-chats.query";

export function SidebarContentRouter() {
  const pathname = usePathname();

  const view = useMemo(() => {
    if (pathname.startsWith("/chats")) return "chats";
    if (pathname.startsWith("/images")) return "images";

    return "personas";
  }, [pathname]);

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
        className="flex flex-1 min-h-0 h-0 w-full flex-col"
      >
        {getContentComponent()}
      </motion.div>
    </AnimatePresence>
  );
}

function SidebarPersonasContent() {
  const { isSignedIn } = useAuth();

  return (
    <SidebarContent className="gap-0 !overflow-hidden">
      <SidebarGroup className="mt-[8px]">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href={"/"}
                  className="h-[38px] text-[16px] rounded-[16px]"
                >
                  <PlanetIcon />
                  <span>Universe</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href={"/"}
                  className="h-[38px] text-[16px] rounded-[16px]"
                >
                  <ShootingStarIcon />
                  <span>New Persona</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {isSignedIn ? <PersonasList /> : <LogInToSavePersonas />}
    </SidebarContent>
  );
}

function LogInToSavePersonas() {
  return (
    <div className="mt-[24px]">
      <p className="text-center text-sm text-zinc-300">
        <SignInButton fallbackRedirectUrl={"https://persona.mynth.io"}>
          Sign in to save personas
        </SignInButton>
      </p>
    </div>
  );
}

function PersonasList() {
  const [searchValue, setSearchValue] = useState("");
  const debouncedQuery = useDebounce(searchValue, 300);

  const { data, isLoading } = useUserPersonasQuery({
    q: debouncedQuery,
  });

  return (
    <>
      <SidebarGroup className="mb-0 pb-0">
        <SidebarMenu autoFocus={false} className="w-full min-w-0">
          <SidebarMenuItem className="w-full min-w-0 mb-[8px]">
            <Search placeholder="Search" onSearchChange={setSearchValue} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <ScrollArea className="flex-1 min-h-0 h-0 w-full min-w-0 max-w-full">
        <SidebarGroup className="w-full min-w-0 mt-0 pt-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full h-[120px] flex items-center justify-center"
              >
                <CircleNotchIcon
                  className="animate-spin text-muted-foreground"
                  size={20}
                />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.225, ease: "easeOut" }}
              >
                <SidebarMenu className="gap-[1px]">
                  {data?.data.map((item) => (
                    <SidebarMenuItem
                      key={item.id}
                      className="w-full overflow-hidden min-w-0"
                    >
                      <SidebarMenuButton asChild>
                        <Link
                          prefetch={false}
                          href={`/workbench/${item.id}`}
                          className="w-full max-md:h-[42px] min-w-0 max-w-full overflow-hidden truncate"
                        >
                          {item.profileImageId ? (
                            <img
                              className="size-[20px] max-md:size-[32px] rounded-[12px] md:rounded-[6px] shrink-0"
                              src={getImageUrl(item.profileImageId!, "thumb")}
                              alt={item.title ?? "Persona"}
                            />
                          ) : (
                            <div className="size-[20px] max-md:size-[32px] rounded-[12px] md:rounded-[6px] bg-surface/10 shrink-0"></div>
                          )}
                          <span className="block truncate grow-0 w-full max-w-full">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </motion.div>
            )}
          </AnimatePresence>
        </SidebarGroup>
      </ScrollArea>
    </>
  );
}

function SidebarChatsContent() {
  const [searchValue, setSearchValue] = useState("");
  const debouncedQuery = useDebounce(searchValue, 300);

  const { data, isLoading } = useUserChatsQuery({ q: debouncedQuery });

  return (
    <>
      <SidebarGroup className="mt-[8px]">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href={"/chats"}
                  className="h-[38px] text-[16px] rounded-[16px]"
                >
                  <PlanetIcon />
                  <span>New chat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="mb-0 pb-0">
        <SidebarMenu autoFocus={false} className="w-full min-w-0">
          <SidebarMenuItem className="w-full min-w-0 mb-[8px]">
            <Search placeholder="Search" onSearchChange={setSearchValue} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <ScrollArea className="flex-1 min-h-0 h-0 w-full min-w-0 max-w-full">
        <SidebarGroup className="w-full min-w-0 mt-0 pt-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full h-[120px] flex items-center justify-center"
              >
                <CircleNotchIcon
                  className="animate-spin text-muted-foreground"
                  size={20}
                />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.225, ease: "easeOut" }}
              >
                <SidebarMenu className="gap-[1px]">
                  {data?.data.map((item) => (
                    <SidebarMenuItem
                      key={item.id}
                      className="w-full overflow-hidden min-w-0"
                    >
                      <SidebarMenuButton asChild>
                        <Link
                          prefetch={false}
                          href={`/chats/${item.id}`}
                          className="w-full max-md:h-[42px] min-w-0 max-w-full overflow-hidden truncate"
                        >
                          {/* <div className="size-[20px] max-md:size-[32px] rounded-[12px] md:rounded-[6px] bg-surface/10 shrink-0"></div> */}

                          <div className="size-[20px] max-md:size-[32px] rounded-[12px] md:rounded-[6px] flex items-center justify-center shrink-0">
                            {item.mode === "roleplay" ? (
                              <ChatsTeardropIcon />
                            ) : (
                              <FeatherIcon />
                            )}
                          </div>

                          <span className="block truncate grow-0 w-full max-w-full">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </motion.div>
            )}
          </AnimatePresence>
        </SidebarGroup>
      </ScrollArea>
    </>
  );
}

function SidebarImagesContent() {
  return <WorkInProgressContent />;
}

function WorkInProgressContent() {
  return (
    <SidebarContent>
      <SidebarGroup>
        <div className="min-h-[120px] mt-[24px] flex flex-col gap-[12px] items-center justify-center py-[24px]">
          <PencilRulerIcon size={32} />
          <p className="font-onest font-[300]">Work In Progress</p>
        </div>
      </SidebarGroup>
    </SidebarContent>
  );
}
