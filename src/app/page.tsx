import FloatingOrbs from "@/components/backgrounds/floating-orbs";
import Home from "./_components/home";
import { GenerationContextProvider } from "@/contexts/generation-context";

export default async function HomePage() {
  return (
    <>
      <FloatingOrbs className="absolute left-0 top-0 right-0 z-10 pointer-events-none" />
      <GenerationContextProvider>
        <Home />
      </GenerationContextProvider>
    </>
  );
}
