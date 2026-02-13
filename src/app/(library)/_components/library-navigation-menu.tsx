"use client";

import { FeatherIcon, Image02Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { memo, type ReactNode } from "react";
import { Link } from "@/components/ui/link";

type NavigationItem = {
  href: string;
  icon: ReactNode;
  label: string;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/library/personas",
    icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} />,
    label: "Personas",
  },
  {
    href: "/library/scenarios",
    icon: <HugeiconsIcon icon={FeatherIcon} strokeWidth={1.5} />,
    label: "Scenarios",
  },
  {
    href: "/library/images",
    icon: <HugeiconsIcon icon={Image02Icon} strokeWidth={1.5} />,
    label: "Images",
  },
];

type NavigationButtonProps = {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
};

const NavigationButton = memo(function NavigationButton({
  href,
  icon,
  label,
  isActive,
}: NavigationButtonProps) {
  return (
    <Button variant={isActive ? "outline" : "ghost"} asChild>
      <Link href={href}>
        {icon}
        <span className="hidden sm:block">{label}</span>
      </Link>
    </Button>
  );
});

export function LibraryNavigationMenu() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      {navigationItems.map((item) => (
        <NavigationButton
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          isActive={pathname.startsWith(item.href)}
        />
      ))}
    </div>
  );
}
