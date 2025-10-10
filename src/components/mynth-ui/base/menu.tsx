import * as React from "react";

import { cn } from "@/lib/utils";
import { Menu as MenuPrimitive } from "@base-ui-components/react/menu";

function Menu({ ...props }: React.ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root data-slot="menu" {...props} />;
}

function MenuTrigger({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  return (
    <MenuPrimitive.Trigger
      data-slot="menu-trigger"
      className={cn(className)}
      {...props}
    />
  );
}

function MenuPositioner({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Positioner>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        data-slot="menu-positioner"
        sideOffset={8}
        className={cn("outline-none select-none z-popup", className)}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

function MenuPopup({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Popup>) {
  return (
    <MenuPrimitive.Popup
      data-slot="menu-popup"
      className={cn(
        "origin-[var(--transform-origin)] rounded-[16px] bg-white py-[4px] text-surface-foreground shadow-md shadow-background/5 outline-[2px] outline-surface-100 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </MenuPrimitive.Popup>
  );
}

function MenuItem({
  className,
  children,
  icon,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  icon?: React.ReactNode;
}) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      className={cn(
        "flex items-center cursor-default h-[38px] md:h-[34px] pr-8 pl-4 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-surface-foreground data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-[14px] data-[highlighted]:before:bg-surface",
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2 shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </MenuPrimitive.Item>
  );
}

function MenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={cn("-mx-1 my-1 h-px bg-surface-100", className)}
      {...props}
    />
  );
}

function MenuArrow({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Arrow>) {
  return (
    <MenuPrimitive.Arrow
      data-slot="menu-arrow"
      className={cn(
        "data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180",
        className
      )}
      {...props}
    />
  );
}

export {
  Menu,
  MenuTrigger,
  MenuPositioner,
  MenuPopup,
  MenuItem,
  MenuSeparator,
  MenuArrow,
};
