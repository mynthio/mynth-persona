"use client";

import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Feather, Image02, Users03 } from "@untitledui/icons";
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
    icon: <Users03 strokeWidth={1.5} />,
    label: "Personas",
  },
  {
    href: "/library/scenarios",
    icon: <Feather strokeWidth={1.5} />,
    label: "Scenarios",
  },
  {
    href: "/library/images",
    icon: <Image02 strokeWidth={1.5} />,
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
