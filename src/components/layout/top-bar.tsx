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
    <div
      className={cn(
        "w-auto max-w-full overflow-hidden flex items-center",
        className
      )}
    >
      {children}
    </div>
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
        "h-10 rounded-lg max-w-full overflow-hidden [&>svg]:size-4 flex items-center justify-center gap-2 w-auto bg-background min-w-10 supports-backdrop-filter:bg-background/40 supports-backdrop-filter:backdrop-blur-lg",
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
        "w-full text-foreground/90 grid gap-2 font-montserrat h-18 items-center px-6 sticky top-0 z-20",
        center ? "grid-cols-[1fr_auto_1fr]" : "flex justify-between",
        className
      )}
      {...props}
    >
      <TopBarSection className="shrink-0">
        <TopBarSectionContent>{left}</TopBarSectionContent>
      </TopBarSection>
      <TopBarSection>
        <TopBarSectionContent className="px-2">{center}</TopBarSectionContent>
      </TopBarSection>
      <TopBarSection className="justify-self-end shrink-0">
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
    <div className="flex items-center text-sm gap-1.5 cursor-default select-none [&>svg]:size-3.5 truncate overflow-hidden max-w-full">
      {children}
    </div>
  );
}

export { TopBar, TopBarSidebarTrigger, TopBarTitle };
