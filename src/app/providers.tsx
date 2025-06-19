import { ClerkProvider } from "@clerk/nextjs";
import { HeroUIProvider } from "@heroui/system";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <HeroUIProvider className="w-full h-full">{children}</HeroUIProvider>
    </ClerkProvider>
  );
}
