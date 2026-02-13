"use client";

import { StarsIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GenerationContextProvider,
  useGenerationContext,
} from "@/contexts/generation-context";
import CreatorScreen from "./_components/creator-screen";
import { TopBar, TopBarSidebarTrigger } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";

function NewIdeaButton() {
  const { resetGeneration } = useGenerationContext();

  return (
    <Button variant="ghost" size="sm" onClick={resetGeneration}>
      <HugeiconsIcon icon={StarsIcon} strokeWidth={1.5} /> New idea
    </Button>
  );
}

export default function PersonaCreatorPage() {
  return (
    <div className="relative z-0">
      <GenerationContextProvider>
        <TopBar left={<TopBarSidebarTrigger />} right={<NewIdeaButton />} />
        <CreatorScreen />
      </GenerationContextProvider>

      <div className="absolute left-0 top-0 right-0 w-full h-full max-h-full overflow-hidden -z-10">
        {/* Atmospheric backdrop - unified with design language */}
        <div className="absolute z-10 inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(145,120,255,0.22),transparent_55%)]" />
        <div className="absolute z-10 inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(197,122,255,0.16),transparent_50%)]" />
        <div className="absolute z-10 inset-0 bg-[radial-gradient(60%_50%_at_50%_50%,rgba(236,72,153,0.08),transparent_60%)]" />
        <div className="absolute z-10 -top-32 right-[-15%] h-[480px] w-[480px] rounded-full bg-primary/12 blur-[140px]" />
        <div className="absolute z-10 -bottom-32 left-[-10%] h-[400px] w-[400px] rounded-full bg-pink-500/10 blur-[160px]" />
        <div className="absolute z-10 inset-0 bg-linear-to-b from-background/40 via-background/70 to-background" />
      </div>
    </div>
  );
}
