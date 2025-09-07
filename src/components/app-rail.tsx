"use client";

import {
  ChatsTeardropIcon,
  CircleNotchIcon,
  ImagesIcon,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { motion } from "motion/react";
import { Link } from "./ui/link";

export function AppRail() {
  const { view, setView, open, setOpen, setOpenMobile } = useSidebar();

  return (
    <>
      <div className="md:hidden w-[64px] shrink-0" />
      <div className="fixed justify-between bg-background z-50 left-0 top-0 bottom-0 w-[64px] py-4 h-full shrink-0 flex flex-col text-sidebar-foreground items-center gap-[8px]">
        <div className="flex flex-col gap-[8px]">
          <PersonaButton />

          <RailSection>
            <RailSectionButton
              isActive={view === "personas"}
              onPress={() => {
                if (view === "personas" && open) {
                  setOpen(false);
                } else {
                  setView("personas");
                  setOpen(true);
                }

                setOpenMobile(true);
              }}
            >
              <UsersThreeIcon />
            </RailSectionButton>

            <RailSectionButton
              isActive={view === "chats"}
              onPress={() => {
                if (view === "chats" && open) {
                  setOpen(false);
                } else {
                  setView("chats");
                  setOpen(true);
                }

                setOpenMobile(true);
              }}
            >
              <ChatsTeardropIcon />
            </RailSectionButton>

            <RailSectionButton
              isActive={view === "images"}
              onPress={() => {
                if (view === "images" && open) {
                  setOpen(false);
                } else {
                  setView("images");
                  setOpen(true);
                }

                setOpenMobile(true);
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
        relative inline-flex size-[42px] items-center justify-center
        rounded-lg text-white overflow-hidden ring-1 ring-white/10
        bg-transparent
      "
    >
      <SparkleIcon size={20} />

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
};

function RailSection({ children }: RailSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center w-[42px] bg-surface/10 rounded-[16px] py-[4px] gap-[4px]">
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
        "relative size-[34px] rounded-[12px]",
        "flex items-center justify-center text-sidebar-foreground/80",
        "transition-all duration-250 will-change-transform",
        "hover:scale-110 hover:text-sidebar-foreground",
        isActive && "text-sidebar-foreground",
      ])}
    >
      {children}
      {isActive ? (
        <motion.div
          layoutId="rail-button-active-indicator"
          id="rail-button-active-indicator"
          className="absolute bg-surface/10 left-0 right-0 top-0 bottom-0 rounded-[12px]"
        />
      ) : null}
    </button>
  );
}

function RailsFooter() {
  const { openUserProfile, signOut, openSignIn } = useClerk();
  const { user, isLoaded, isSignedIn } = useUser();

  return (
    <div className="flex flex-col gap-[8px]">
      {isLoaded && isSignedIn && <RailsTookens />}

      <RailSection>
        <div className="size-[34px] rounded-[12px] flex items-center justify-center">
          {!isLoaded ? (
            <CircleNotchIcon className="animate-spin" />
          ) : !isSignedIn ? (
            <button
              onClick={() => openSignIn()}
              className="size-[34px] flex items-center justify-center"
            >
              <SignInIcon />
            </button>
          ) : (
            <Menu.Root modal={false}>
              <Menu.Trigger>
                {user?.imageUrl ? (
                  <img
                    className="size-[34px] object-cover rounded-[12px]"
                    src={user?.imageUrl}
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
                  className="outline-0 z-100"
                >
                  <Menu.Popup
                    className={cn(
                      "p-[4px] bg-surface rounded-[16px] min-w-[222px] z-100 border-2 border-surface-100/50",
                      "transition-all duration-250",
                      "",
                      "data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
                      "data-[ending-style]:scale-90 data-[ending-style]:opacity-0"
                    )}
                  >
                    <Menu.Item
                      className={cn(
                        "h-[42px] flex items-center justify-start px-[12px] gap-[12px] hover:bg-surface-100 rounded-[12px] cursor-pointer transition-colors duration-225"
                      )}
                      onClick={() => openUserProfile()}
                    >
                      <UserGearIcon />
                      Account Settings
                    </Menu.Item>

                    <Menu.Item
                      className={cn(
                        "h-[42px] flex items-center justify-start px-[12px] gap-[12px] hover:bg-surface-100 rounded-[12px] cursor-pointer transition-colors duration-225"
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
    return data.balance > 999 ? "999+" : data.balance;
  }, [data, isLoading]);

  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger>
        <div className="bg-[#572BDB]/50 w-full rounded-lg h-[32px] flex items-center justify-center font-bold text-[11px]">
          {content}
        </div>
      </TooltipTrigger>

      <TooltipContent align="center" side="right">
        {data?.balance}
      </TooltipContent>
    </Tooltip>
  );
}
