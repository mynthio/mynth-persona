import { TopBar, TopBarSidebarTrigger } from "@/components/layout/top-bar";
import { LibraryNavigationMenu } from "./_components/library-navigation-menu";

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
