import type { Metadata } from "next";
import { TopBar, TopBarSidebarTrigger } from "@/components/layout/top-bar";
import { LibraryNavigationMenu } from "./_components/library-navigation-menu";

// Noindex for private user library pages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBar
        left={<TopBarSidebarTrigger />}
        right={<LibraryNavigationMenu />}
      />
      {children}
    </>
  );
}
