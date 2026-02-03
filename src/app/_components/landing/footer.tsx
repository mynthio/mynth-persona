import { Link } from "@/components/ui/link";
import { HeartIcon } from "@phosphor-icons/react/dist/ssr";

export function Footer() {
  return (
    <footer className="relative py-12 sm:py-16 px-5 sm:px-6 md:px-16 bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      <div className="max-w-7xl mx-auto">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl font-bold text-foreground tracking-tight">
            PRSNA
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground">
            <Link
              href="/explore"
              className="hover:text-foreground transition-colors"
            >
              Explore
            </Link>
            <Link href="/art" className="hover:text-foreground transition-colors">
              Art
            </Link>
            <Link
              href="/scenarios"
              className="hover:text-foreground transition-colors"
            >
              Scenarios
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            Made with <HeartIcon className="inline ml-1 mb-0.5" />
          </div>
        </div>
      </div>
    </footer>
  );
}
