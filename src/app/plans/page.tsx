import { auth } from "@clerk/nextjs/server";
import { Plans } from "./_client";
import { PlansFAQ } from "./_components/faq";

export default async function PlansPage() {
  await auth();

  return (
    <div className="mx-auto w-full max-w-4xl py-10 px-4">
      <Plans />

      <PlansFAQ />

      {/* Footer with legal links */}
      <footer className="mt-16 pt-8 border-t border-surface-200">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 text-sm text-surface-foreground/60">
          <a
            href="/terms-of-service"
            className="hover:text-surface-foreground transition-colors duration-200"
          >
            Terms of Service
          </a>
          <span className="hidden sm:block text-surface-foreground/30">•</span>
          <a
            href="/privacy-policy"
            className="hover:text-surface-foreground transition-colors duration-200"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
