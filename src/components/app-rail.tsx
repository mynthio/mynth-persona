"use client";

import { useSubscription } from "@clerk/nextjs/experimental";
import {
  ChatsTeardropIcon,
  CircleNotchIcon,
  DiscordLogoIcon,
  FlameIcon,
  ImagesIcon,
  PlanetIcon,
  SidebarIcon,
  SignInIcon,
  SignOutIcon,
  UserGearIcon,
  UserIcon,
  UsersThreeIcon,
  InfoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Menu } from "@base-ui-components/react/menu";

import { useSidebar } from "./ui/sidebar";
import { ComponentProps, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { Tooltip, TooltipPopup, TooltipTrigger } from "./ui/tooltip";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "./ui/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DISCORD_INVITE_URL,
  GITHUB_REPO_URL,
  INSTAGRAM_PROFILE_URL,
  X_PROFILE_URL,
} from "@/lib/constants";
import {
  Menu as BaseMenu,
  MenuTrigger as BaseMenuTrigger,
  MenuPositioner as BaseMenuPositioner,
  MenuPopup as BaseMenuPopup,
  MenuItem as BaseMenuItem,
  MenuSeparator as BaseMenuSeparator,
  MenuArrow as BaseMenuArrow,
} from "@/components/mynth-ui/base/menu";
import { PlanId } from "@/config/shared/plans";

export function AppRail() {
  const { setView, open, setOpen, setOpenMobile } = useSidebar();
  const { replace } = useRouter();
  const pathname = usePathname();

  const view = useMemo(() => {
    if (pathname.startsWith("/chats")) return "chats";
    if (pathname.startsWith("/images")) return "images";

    return "personas";
  }, [pathname]);

  const isChatWithPersona = pathname.startsWith("/chats/pch_");

  return (
    <>
      <div
        className={cn(
          "fixed px-[12px] md:px-0 justify-between bg-background/80 backdrop-blur-lg md:bg-background md:backdrop-blur-none rounded-[14px] md:rounded-none left-[12px] md:left-0 md:top-0 md:right-auto right-[12px] bottom-[3px] md:bottom-0 md:w-[64px] py-4 h-[84px] md:h-full shrink-0 flex md:flex-col text-sidebar-foreground items-center gap-[8px]",
          isChatWithPersona ? "z-0 md:z-rail" : "z-rail"
        )}
      >
        <div className="flex md:flex-col gap-[8px] items-center md:items-start">
          <PersonaButton />

          <RailSection className="md:hidden">
            <RailSectionButton
              isActive={false}
              onPress={() => {
                setOpenMobile(true);
              }}
            >
              <SidebarIcon />
            </RailSectionButton>
          </RailSection>

          <AnimatePresence>
            <RailSection>
              <RailSectionButton
                isActive={view === "personas"}
                onPress={() => {
                  if (view !== "personas") {
                    replace("/");
                  }

                  if (view === "personas" && open) {
                    setOpen(false);
                  } else {
                    setView("personas");
                    setOpen(true);
                  }

                  if (view === "personas") setOpenMobile(true);
                }}
              >
                <UsersThreeIcon />
                {view === "personas" ? (
                  <motion.div
                    layoutId="rail-button-active-indicator"
                    id="rail-button-active-indicator"
                    className="absolute bg-foreground/30 left-0 top-0 w-full h-full rounded-[12px]"
                  />
                ) : null}
              </RailSectionButton>

              <RailSectionButton
                isActive={view === "chats"}
                onPress={() => {
                  if (view !== "chats") {
                    replace("/chats");
                  }

                  if (view === "chats" && open) {
                    setOpen(false);
                  } else {
                    setView("chats");
                    setOpen(true);
                  }

                  if (view === "chats") setOpenMobile(true);
                }}
              >
                <ChatsTeardropIcon />
                {view === "chats" ? (
                  <motion.div
                    layoutId="rail-button-active-indicator"
                    id="rail-button-active-indicator"
                    className="absolute bg-foreground/30 left-0 top-0 w-full h-full rounded-[12px]"
                  />
                ) : null}
              </RailSectionButton>

              <RailSectionButton
                isActive={view === "images"}
                onPress={() => {
                  if (view !== "images") {
                    replace("/images");
                  }

                  if (view === "images" && open) {
                    setOpen(false);
                  } else {
                    setView("images");
                    setOpen(true);
                  }

                  if (view === "images") setOpenMobile(true);
                }}
              >
                <ImagesIcon />
                {view === "images" ? (
                  <motion.div
                    layoutId="rail-button-active-indicator"
                    id="rail-button-active-indicator"
                    className="absolute bg-foreground/30 left-0 top-0 w-full h-full rounded-[12px]"
                  />
                ) : null}
              </RailSectionButton>
            </RailSection>
          </AnimatePresence>
        </div>
        <RailsFooter />
      </div>
    </>
  );
}

function PersonaButton() {
  return (
    <Link
      prefetch={false}
      href="/"
      className="relative inline-flex size-[52px] md:size-[42px] items-center justify-center rounded-lg text-white overflow-hidden bg-transparent transition-all duration-200 will-change-transform hover:scale-110"
    >
      <PlanetIcon className="size-[24px] md:size-[18px] text-white/80" />

      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full -z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="blur10" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0b1020" />
            <stop offset="100%" stopColor="#101638" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill="url(#base)" rx="8" />
        {/* Bokeh circles */}
        <g filter="url(#blur10)" opacity="0.95">
          <circle cx="8" cy="10" r="10" fill="#6d3df1" />
          <circle cx="30" cy="12" r="11" fill="#9a5cff" />
          <circle cx="12" cy="30" r="10" fill="#2e2a8f" />
          <circle cx="28" cy="30" r="12" fill="#1a1466" />
          {/* White soft glints (very subtle) */}
          <circle cx="24" cy="16" r="4" fill="#ffffff" opacity="0.08" />
          <circle cx="16" cy="26" r="3" fill="#ffffff" opacity="0.06" />
        </g>
      </svg>
    </Link>
  );
}

type RailSectionProps = {
  children: React.ReactNode;
  className?: string;
};

function RailSection({ children, className }: RailSectionProps) {
  return (
    <div
      className={cn(
        "flex md:flex-col relative items-center justify-center h-[48px] md:h-auto md:w-[42px] bg-foreground/20 rounded-[16px] px-[4px] md:px-0 md:py-[4px] gap-[4px]",
        className
      )}
    >
      {children}
    </div>
  );
}

type RailSectionButtonProps = {
  children: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
} & ComponentProps<"button">;

function RailSectionButton({
  children,
  isActive,
  onPress,
}: RailSectionButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "relative size-[40px] md:size-[34px] rounded-[12px] flex items-center justify-center text-foreground/80 transition-all duration-250 will-change-transform hover:scale-110 hover:text-foreground",
        isActive && "text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function RailsFooter() {
  const { openUserProfile, signOut, openSignIn } = useClerk();
  const { user, isLoaded, isSignedIn } = useUser();
  const { push } = useRouter();

  return (
    <div className="flex md:flex-col items-center justify-center gap-[8px]">
      <div className="hidden md:flex md:flex-col items-center justify-center gap-[2px] mb-[12px]">
        {/* Info menu */}
        <BaseMenu>
          <BaseMenuTrigger className="flex items-center justify-center size-[40px] md:size-[34px] rounded-[12px] hover:bg-foreground/10">
            <InfoIcon />
          </BaseMenuTrigger>
          <BaseMenuPositioner align="end" side="right">
            <BaseMenuPopup>
              <BaseMenuItem onClick={() => push("/terms-of-service")}>
                Terms of Use
              </BaseMenuItem>
              <BaseMenuItem onClick={() => push("/privacy-policy")}>
                Privacy Policy
              </BaseMenuItem>
              <BaseMenuSeparator />
              <BaseMenuItem
                onClick={() => window.open(DISCORD_INVITE_URL, "_blank")}
              >
                Discord
              </BaseMenuItem>
              <BaseMenuItem
                onClick={() => window.open(GITHUB_REPO_URL, "_blank")}
              >
                GitHub
              </BaseMenuItem>
              <BaseMenuItem
                onClick={() => window.open(INSTAGRAM_PROFILE_URL, "_blank")}
              >
                Instagram
              </BaseMenuItem>
              <BaseMenuItem
                onClick={() => window.open(X_PROFILE_URL, "_blank")}
              >
                X
              </BaseMenuItem>
              <BaseMenuArrow />
            </BaseMenuPopup>
          </BaseMenuPositioner>
        </BaseMenu>

        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center size-[40px] md:size-[34px] rounded-[12px] hover:bg-foreground/10"
        >
          <DiscordLogoIcon />
        </a>
        {/* <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center size-[40px] md:size-[34px] rounded-[12px] hover:bg-foreground/10"
        >
          <GithubLogoIcon />
        </a> */}
      </div>

      {isLoaded && isSignedIn && <RailsPlan />}

      <RailSection>
        <div className="size-[38px] md:size-[34px] rounded-[12px] flex items-center justify-center">
          {!isLoaded ? (
            <CircleNotchIcon className="animate-spin" />
          ) : !isSignedIn ? (
            <button
              onClick={() =>
                openSignIn({
                  fallbackRedirectUrl: "https://persona.mynth.io",
                })
              }
              className="size-[38px] md:size-[34px] flex items-center justify-center"
            >
              <SignInIcon />
            </button>
          ) : (
            <Menu.Root modal={false}>
              <Menu.Trigger className="cursor-pointer">
                {user?.imageUrl ? (
                  <img
                    className="size-[38px] md:size-[34px] object-cover rounded-[12px]"
                    src={user?.imageUrl}
                    alt={user.firstName ?? user.username ?? "Avatar"}
                  />
                ) : (
                  <UserIcon />
                )}
              </Menu.Trigger>

              <Menu.Portal>
                <Menu.Positioner
                  alignOffset={8}
                  align="end"
                  side="right"
                  sideOffset={8}
                  className="outline-0 z-popup"
                >
                  <Menu.Popup
                    className={cn(
                      "p-[4px] bg-background/90 backdrop-blur-[4px] text-foreground/90 rounded-[16px] min-w-[222px] z-100 border-2 border-foreground/20 shadow-2xl shadow-foreground/15 transition-all duration-250 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[ending-style]:scale-90 data-[ending-style]:opacity-0"
                    )}
                  >
                    <Menu.Item
                      className={cn(
                        "h-[42px] flex items-center justify-start px-[12px] gap-[12px] hover:bg-foreground/10 rounded-[12px] cursor-pointer transition-colors duration-225"
                      )}
                      onClick={() => push("/plans")}
                    >
                      <FlameIcon />
                      Plans
                    </Menu.Item>

                    <Menu.Item
                      className={cn(
                        "h-[42px] flex items-center justify-start px-[12px] gap-[12px] hover:bg-foreground/10 rounded-[12px] cursor-pointer transition-colors duration-225"
                      )}
                      onClick={() =>
                        openUserProfile({
                          __experimental_startPath: "/billing",
                        })
                      }
                    >
                      <UserGearIcon />
                      Billing
                    </Menu.Item>

                    <Menu.Item
                      className={cn(
                        "h-[42px] flex items-center justify-start px-[12px] gap-[12px] hover:bg-foreground/10 rounded-[12px] cursor-pointer transition-colors duration-225"
                      )}
                      onClick={() => openUserProfile()}
                    >
                      <UserGearIcon />
                      Account Settings
                    </Menu.Item>

                    <Menu.Item
                      className={cn(
                        "h-[42px] flex items-center justify-start px-[12px] gap-[12px] hover:bg-foreground/10 rounded-[12px] cursor-pointer transition-colors duration-225"
                      )}
                      onClick={() => signOut()}
                    >
                      <SignOutIcon />
                      Sign Out
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          )}
        </div>
      </RailSection>
    </div>
  );
}

function RailsPlan() {
  const { sessionClaims } = useAuth();

  const planName = (
    typeof sessionClaims?.pla === "string"
      ? sessionClaims.pla.split(":")[1]
      : "free"
  ) as PlanId;

  const colorClassForPlan: Record<PlanId, string> = {
    free: "text-emerald-500",
    spark: "text-yellow-500",
    flame: "text-rose-500",
    blaze: "text-red-500",
  } as const;

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "px-[6px] md:px-0 w-full rounded-lg h-[24px] gap-[6px] flex items-center justify-center text-[12px]",
          colorClassForPlan[planName]
        )}
      >
        <Link
          href="/plans"
          className="size-[36px] flex items-center justify-center"
        >
          <FlameIcon />
        </Link>
      </TooltipTrigger>

      <TooltipPopup>Manage your plan</TooltipPopup>
    </Tooltip>
  );
}
