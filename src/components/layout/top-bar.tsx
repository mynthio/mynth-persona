import React from "react";

import { cn } from "@/lib/utils";
import { SidebarTrigger } from "../ui/sidebar";
import { Kbd } from "../ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

function TopBarSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-auto flex items-center", className)}>{children}</div>
  );
}

function TopBarSectionContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-10 rounded-lg flex items-center gap-2 w-auto bg-background min-w-0 supports-backdrop-filter:bg-background/40 supports-backdrop-filter:backdrop-blur-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

const TopBar = React.forwardRef<HTMLDivElement, TopBarProps>(
  ({ className, left, center, right, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-full text-foreground/90 grid h-18 grid-cols-[1fr_auto_1fr] items-center px-6 sticky top-0 z-10",
        className
      )}
      {...props}
    >
      <TopBarSection>
        <TopBarSectionContent>{left}</TopBarSectionContent>
      </TopBarSection>
      <TopBarSection>
        <TopBarSectionContent className="px-2">{center}</TopBarSectionContent>
      </TopBarSection>
      <TopBarSection className="justify-self-end">
        <TopBarSectionContent>{right}</TopBarSectionContent>
      </TopBarSection>
    </div>
  )
);

TopBar.displayName = "TopBar";

function TopBarSidebarTrigger() {
  return (
    <Tooltip delayDuration={450}>
      <TooltipTrigger asChild>
        <SidebarTrigger />
      </TooltipTrigger>
      <TooltipContent>
        <Kbd>⌘ + B</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

function TopBarTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center text-sm gap-1.5 cursor-default pointer-events-none select-none [&>svg]:size-3.5">
      {children}
    </span>
  );
}

export { TopBar, TopBarSidebarTrigger, TopBarTitle };
