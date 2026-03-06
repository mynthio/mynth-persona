import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { MobileSidebarTrigger } from "./_components/landing/mobile-sidebar-trigger";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";

export default function NotFoundPage() {
  return (
    <div className="relative flex h-full min-h-screen w-full items-center justify-center">
      <MobileSidebarTrigger />

      <div className="flex flex-col items-center justify-center gap-[24px] px-[12px] py-20">
        <img
          src="https://mynth-persona-prod.b-cdn.net/static/persona-oops.webp"
          alt="Not Found"
          className="max-w-[320px]"
        />

        <p className="font-onest font-[500] text-[2.3rem] leading-[2.2rem] text-center text-balance">
          Oops!
          <br className="md:hidden" /> Page Not Found
        </p>

        <Button asChild size="lg" className="rounded-full px-5">
          <Link href="/">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            Go back home
          </Link>
        </Button>
      </div>
    </div>
  );
}
