"use client";

import { Login03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChevronsUpDown,
  CreditCard,
  Flame,
  LogOut,
  Moon,
  Settings,
  Sun,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SignedIn, SignedOut, useAuth, useClerk, useUser } from "@clerk/nextjs";
import { PlanId } from "@/config/shared/plans";
import { useRouter } from "next/navigation";

export function NavUser() {
  const { user } = useUser();
  const { isMobile } = useSidebar();
  const { setTheme, theme } = useTheme();
  const { sessionClaims } = useAuth();
  const { openUserProfile, signOut, openSignIn } = useClerk();
  const { push } = useRouter();

  const planName = (
    typeof sessionClaims?.pla === "string"
      ? sessionClaims.pla.split(":")[1]
      : "free"
  ) as PlanId;

  return (
    <SidebarMenu>
      <SignedIn>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="h-12 data-[state=open]:bg-sidebar-accent/60 dark:data-[state=open]:bg-white/[0.06] group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
              >
                <Avatar className="size-8 rounded-full ring-2 ring-sidebar-border">
                  <AvatarImage
                    className="object-cover"
                    src={user?.imageUrl}
                    alt={user?.username ?? "Avatar"}
                  />
                  <AvatarFallback className="rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {user?.username?.slice(0, 2).toUpperCase() ?? "AN"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">
                    {user?.username ?? "Anonymous"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground capitalize">
                    {planName}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 opacity-50 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-2 py-2.5 text-left text-sm">
                  <Avatar className="size-10 rounded-full ring-2 ring-border">
                    <AvatarImage
                      src={user?.imageUrl}
                      alt={user?.username ?? "Avatar"}
                    />
                    <AvatarFallback className="rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {user?.username?.slice(0, 2).toUpperCase() ?? "AN"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold">
                      {user?.username ?? "Anonymous"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground capitalize">
                      {planName} plan
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => push("/plans")}>
                  <Flame className="text-orange-500" />
                  Upgrade Plan
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() =>
                    openUserProfile({
                      __experimental_startPath: "/billing",
                    })
                  }
                >
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openUserProfile()}>
                  <Settings />
                  Account Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold px-2">
                Theme
              </DropdownMenuLabel>
              <DropdownMenuGroup className="flex gap-1 px-2 pb-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-colors ${
                    theme === "light"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Sun className="size-3.5" />
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-colors ${
                    theme === "dark"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Moon className="size-3.5" />
                  Dark
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-colors ${
                    theme === "system"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Monitor className="size-3.5" />
                  Auto
                </button>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SignedIn>
      <SignedOut>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => openSignIn()}
            className="h-12 bg-primary/5 hover:bg-primary/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-sidebar-border/50 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon icon={Login03Icon} strokeWidth={2} className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">Sign In</span>
              <span className="truncate text-xs text-muted-foreground">
                Get started for free
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SignedOut>
    </SidebarMenu>
  );
}
