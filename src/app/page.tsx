import FloatingOrbs from "@/components/backgrounds/floating-orbs";

import Home from "./_components/home";

import { GenerationContextProvider } from "@/contexts/generation-context";
import { HalloweenSection } from "./_components/halloween-section";

export default async function HomePage() {
  return (
    <>
      <HalloweenSection />
      <GenerationContextProvider>
        <Home />
      </GenerationContextProvider>

      <FloatingOrbs className="absolute left-0 top-0 right-0 -z-1 pointer-events-none" />
    </>
  );
}
