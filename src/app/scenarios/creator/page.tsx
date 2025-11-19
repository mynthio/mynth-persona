import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ScenarioCreatorForm from "./_components/form";
import { TopBar, TopBarSidebarTrigger } from "@/components/layout/top-bar";
import { AlertTriangle } from "@untitledui/icons";
import { Button } from "@/components/ui/button";
import { DISCORD_INVITE_URL } from "@/lib/constants";

export default function ScenarioCreatorPage() {
  return (
    <div className="w-full h-full">
      <TopBar left={<TopBarSidebarTrigger />} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-6 sm:pt-12 sm:pb-12">
        <div className="max-w-xl mx-auto">
          <Alert className="mb-4">
            <AlertTriangle />
            <AlertTitle>Scenarios will be changed in future!</AlertTitle>
            <AlertDescription>
              Scenarios are currently in beta and will be changed in the future.
              We already thinking about changing personas to roles for more
              possibilities when building scenarios. Learn more and give
              feedback on Discord.
              <Button asChild variant="outline" className="mt-2">
                <a href={DISCORD_INVITE_URL} target="_blank">
                  Join Discord
                </a>
              </Button>
            </AlertDescription>
          </Alert>
          <ScenarioCreatorForm />
        </div>
      </div>
    </div>
  );
}
