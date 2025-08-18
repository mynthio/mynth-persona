"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { RocketLaunch } from "@phosphor-icons/react/dist/ssr";

export default function WorkbenchSidebarPublish() {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex-1 min-h-0">
        <div className="mt-6 rounded-md border border-zinc-200/60 bg-zinc-50 p-3 text-sm text-zinc-700">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-[11px]">
              Coming soon
            </Badge>
            <span className="font-medium">Publish</span>
          </div>
          <p className="text-[12px] leading-relaxed">
            Export, share, embed—give your persona a passport to the internet.
            We’re building it now. Want early say in the launch codes? Hop in
            our Discord and help steer the roadmap.
          </p>
          <div className="mt-3">
            <Button asChild size="sm" className="h-8 px-3 text-[12px]">
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <RocketLaunch />
                Join the Discord
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
