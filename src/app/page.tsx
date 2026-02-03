import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getPublicPersonas } from "./_components/landing/data";
import { HeroSkeleton } from "./_components/landing/hero-skeleton";
import { PersonasSkeleton } from "./_components/landing/personas-skeleton";
import { Footer } from "./_components/landing/footer";
import { MobileSidebarTrigger } from "./_components/landing/mobile-sidebar-trigger";

// Dynamic imports for heavy client components (bundle-dynamic-imports)
// These use motion/react which is a large bundle
const HeroSection = dynamic(
  () => import("./_components/landing/hero-section").then((m) => m.HeroSection),
  {
    loading: () => <HeroSkeleton />,
  }
);

const FeatureShowcase = dynamic(
  () =>
    import("./_components/landing/feature-showcase").then(
      (m) => m.FeatureShowcase
    ),
  {
    ssr: true,
  }
);

const ModelsSection = dynamic(
  () =>
    import("./_components/landing/models-section").then(
      (m) => m.ModelsSection
    ),
  {
    ssr: true,
  }
);

const PersonasSection = dynamic(
  () =>
    import("./_components/landing/personas-section").then(
      (m) => m.PersonasSection
    ),
  {
    loading: () => <PersonasSkeleton />,
  }
);

const EcoModelsSection = dynamic(
  () =>
    import("./_components/landing/eco-models-section").then(
      (m) => m.EcoModelsSection
    ),
  {
    ssr: true,
  }
);

const CreateSection = dynamic(
  () =>
    import("./_components/landing/create-section").then((m) => m.CreateSection),
  {
    ssr: true,
  }
);

// Server Component that fetches data and renders async content
async function HeroWithData() {
  const personas = await getPublicPersonas();
  const featured = personas.slice(0, 6);

  if (!featured.length) {
    return <HeroSkeleton />;
  }

  return <HeroSection personas={featured} />;
}

async function TrendingPersonas() {
  const personas = await getPublicPersonas();
  const trending = personas.slice(0, 8);

  if (!trending.length) {
    return null;
  }

  return (
    <PersonasSection
      title="Trending Characters"
      subtitle="Most popular personas this week"
      personas={trending}
      viewAllHref="/explore"
    />
  );
}

async function RecentPersonas() {
  const personas = await getPublicPersonas();
  const recent = personas.slice(8, 16);

  if (!recent.length) {
    return null;
  }

  return (
    <PersonasSection
      title="Recently Added"
      subtitle="Fresh faces to discover"
      personas={recent}
      viewAllHref="/explore"
    />
  );
}

// Main page component - Server Component (no "use client")
export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* SEO H1 - visually hidden but accessible to search engines */}
      <h1 className="sr-only">
        AI Roleplay Chat & Character Generator - Create Your Perfect AI Companion
      </h1>

      {/* Mobile sidebar trigger - only visible on mobile */}
      <MobileSidebarTrigger />

      {/* Hero with Suspense for streaming (async-suspense-boundaries) */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroWithData />
      </Suspense>

      <ModelsSection />

      <FeatureShowcase />

      {/* Trending section with Suspense */}
      <Suspense fallback={<PersonasSkeleton />}>
        <TrendingPersonas />
      </Suspense>

      <EcoModelsSection />

      {/* Recent section with Suspense */}
      <Suspense fallback={<PersonasSkeleton />}>
        <RecentPersonas />
      </Suspense>

      <CreateSection />

      {/* Footer is a Server Component - no JS shipped */}
      <Footer />
    </div>
  );
}
