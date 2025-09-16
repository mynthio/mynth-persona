import FloatingOrbs from "@/components/backgrounds/floating-orbs";
import Home from "./_components/home";
import { GenerationContextProvider } from "@/contexts/generation-context";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <GenerationContextProvider>
        <Home />
      </GenerationContextProvider>

      <FloatingOrbs className="absolute left-0 top-0 right-0 -z-1 pointer-events-none" />
    </>
  );
}
