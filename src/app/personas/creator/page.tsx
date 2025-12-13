"use client";

import {
  GenerationContextProvider,
  useGenerationContext,
} from "@/contexts/generation-context";
import CreatorScreen from "./_components/creator-screen";
import { TopBar, TopBarSidebarTrigger } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Stars02 } from "@untitledui/icons";

function NewIdeaButton() {
  const { resetGeneration } = useGenerationContext();

  return (
    <Button variant="ghost" size="sm" onClick={resetGeneration}>
      <Stars02 strokeWidth={1.5} /> New idea
    </Button>
  );
}

export default function PersonaCreatorPage() {
  return (
    <GenerationContextProvider>
      <TopBar left={<TopBarSidebarTrigger />} right={<NewIdeaButton />} />
      <CreatorScreen />
    </GenerationContextProvider>
  );
}
