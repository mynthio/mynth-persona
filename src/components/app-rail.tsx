"use client";

import {
  ChatsTeardropIcon,
  CircleNotchIcon,
  DiscordLogoIcon,
  GithubLogoIcon,
  ImagesIcon,
  PlanetIcon,
  SidebarIcon,
  SignInIcon,
  SignOutIcon,
  SparkleIcon,
  UserGearIcon,
  UserIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Menu } from "@base-ui-components/react/menu";

import { useSidebar } from "./ui/sidebar";
import { ComponentProps, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useTokensBalance } from "@/app/_queries/use-tokens-balance.query";
import { Tooltip, TooltipPopup, TooltipTrigger } from "./ui/tooltip";
import { motion } from "motion/react";
import { Link } from "./ui/link";
import { usePathname, useRouter } from "next/navigation";
import { DISCORD_INVITE_URL, GITHUB_REPO_URL } from "@/lib/constants";

export function AppRail() {
  const { setView, open, setOpen, setOpenMobile } = useSidebar();
  const { replace } = useRouter();
  const pathname = usePathname();

  const view = useMemo(() => {
    if (pathname.startsWith("/chats")) return "chats";
    if (pathname.startsWith("/images")) return "images";

    return "personas";
  }, [pathname]);

  return (
    <>
      {/* <div className="md:hidden w-[64px] shrink-0" /> */}
      <div
        className="
                    fixed z-[999999999] px-[12px] md:px-0 justify-between 
                    bg-background/80 backdrop-blur-lg md:bg-background md:backdrop-blur-none
                    rounded-[14px] md:rounded-none
                    left-[12px] md:left-0
                    md:top-0 
                    md:right-auto right-[12px] 
                    bottom-[3px] md:bottom-0 
                    md:w-[64px] 
                    py-4 
                    h-[84px] md:h-full 
                    shrink-0 flex md:flex-col 
                    text-sidebar-foreground items-center gap-[8px]
                  "
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

          <RailSection>
            <RailSectionButton
              isActive={view === "personas"}
              onPress={() => {
                replace("/");

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
            </RailSectionButton>

            <RailSectionButton
              isActive={view === "chats"}
              onPress={() => {
                replace("/chats");

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
            </RailSectionButton>

            <RailSectionButton
              isActive={view === "images"}
              onPress={() => {
                replace("/images");

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
            </RailSectionButton>
          </RailSection>
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
      className="
        relative inline-flex size-[52px] md:size-[42px] items-center justify-center
        rounded-lg text-white overflow-hidden ring-1 ring-white/10
        bg-transparent
        transition-all duration-200 will-change-transform
        hover:scale-110
      "
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
      className={cn([
        "flex md:flex-col relative items-center justify-center h-[48px] md:h-auto md:w-[42px] bg-foreground/20 rounded-[16px] px-[4px] md:px-0 md:py-[4px] gap-[4px]",
        className,
      ])}
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
      className={cn([
        "relative size-[40px] md:size-[34px] rounded-[12px]",
        "flex items-center justify-center text-foreground/80",
        "transition-all duration-250 will-change-transform",
        "hover:scale-110 hover:text-foreground",
        isActive && "text-foreground",
      ])}
    >
      {children}
      {isActive ? (
        <motion.div
          layoutId="rail-button-active-indicator"
          id="rail-button-active-indicator"
          className="absolute bg-foreground/30 left-0 right-0 top-0 bottom-0 rounded-[12px]"
        />
      ) : null}
    </button>
  );
}

function RailsFooter() {
  const { openUserProfile, signOut, openSignIn } = useClerk();
  const { user, isLoaded, isSignedIn } = useUser();

  return (
    <div className="flex md:flex-col items-center justify-center gap-[8px]">
      <div className="hidden md:flex md:flex-col items-center justify-center gap-[2px] mb-[12px]">
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center size-[40px] md:size-[34px] rounded-[12px] hover:bg-foreground/10"
        >
          <DiscordLogoIcon />
        </a>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center size-[40px] md:size-[34px] rounded-[12px] hover:bg-foreground/10"
        >
          <GithubLogoIcon />
        </a>
      </div>

      {isLoaded && isSignedIn && <RailsTookens />}

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
                  className="outline-0 z-[99999999999999]"
                >
                  <Menu.Popup
                    className={cn(
                      "p-[4px] bg-background/90 backdrop-blur-[4px] text-foreground/90 rounded-[16px] min-w-[222px] z-100 border-2 border-foreground/20 shadow-2xl shadow-foreground/15",
                      "transition-all duration-250",
                      "",
                      "data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
                      "data-[ending-style]:scale-90 data-[ending-style]:opacity-0"
                    )}
                  >
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

function RailsTookens() {
  const { data, isLoading } = useTokensBalance();

  const content = useMemo(() => {
    if (!data && isLoading) return <CircleNotchIcon className="animate-spin" />;
    if (!data) return 0;

    return (
      <Link href="/tokens">{data.balance > 999 ? "999+" : data.balance}</Link>
    );
  }, [data, isLoading]);

  return (
    <Tooltip>
      <TooltipTrigger className="bg-gradient-to-tr from-[#5527DD] via-purple-700 to-violet-900 text-white/90 px-[6px] md:px-0 w-full rounded-lg h-[32px] flex items-center justify-center font-bold text-[11px]">
        {content}
      </TooltipTrigger>

      <TooltipPopup>{data?.balance}</TooltipPopup>
    </Tooltip>
  );
}
