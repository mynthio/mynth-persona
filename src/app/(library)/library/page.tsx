import { DiscordIcon, HeartCheckIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { DISCORD_INVITE_URL } from "@/lib/constants";

export default function LibraryPage() {
  return (
    <div className="w-full h-full max-w-xl mx-auto text-center text-balance mt-10 container flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-6 px-4">
        <HugeiconsIcon icon={HeartCheckIcon} className="size-10 text-muted-foreground" />

        <div className="space-y-3">
          <p className="text-lg">
            Welcome to your library! We&apos;re still working on the library
            home page, but you can browse all your content using the menu above.
          </p>

          <p className="text-muted-foreground">
            Have ideas for what you&apos;d like to see here?{" "}
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              Share them on Discord
            </a>
            .
          </p>
        </div>

        <Button variant="outline" asChild className="mt-2">
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer">
            <HugeiconsIcon icon={DiscordIcon} strokeWidth={1.5} />
            Join our Discord
          </a>
        </Button>
      </div>
    </div>
  );
}
