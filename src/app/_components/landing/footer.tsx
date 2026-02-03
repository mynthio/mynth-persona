import { Link } from "@/components/ui/link";
import { HeartIcon } from "@phosphor-icons/react/dist/ssr";

export function Footer() {
  return (
    <footer className="relative py-12 sm:py-16 px-5 sm:px-6 md:px-16 bg-black/80">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl font-bold text-white tracking-tight">
            PRSNA
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-white/40">
            <Link
              href="/explore"
              className="hover:text-white transition-colors"
            >
              Explore
            </Link>
            <Link href="/art" className="hover:text-white transition-colors">
              Art
            </Link>
            <Link
              href="/scenarios"
              className="hover:text-white transition-colors"
            >
              Scenarios
            </Link>
          </div>
          <div className="text-sm text-white/30">
            Made with <HeartIcon className="inline ml-1 mb-0.5" />
          </div>
        </div>
      </div>
    </footer>
  );
}
