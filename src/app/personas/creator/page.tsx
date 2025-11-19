import { GenerationContextProvider } from "@/contexts/generation-context";
import CreatorScreen from "./_components/creator-screen";
import {
  TopBar,
  TopBarSidebarTrigger,
  TopBarTitle,
} from "@/components/layout/top-bar";

export default function PersonaCreatorPage() {
  return (
    <GenerationContextProvider>
      <TopBar left={<TopBarSidebarTrigger />} />
      <CreatorScreen />
    </GenerationContextProvider>
  );
}
