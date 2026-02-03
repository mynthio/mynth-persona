export function HeroSkeleton() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-background">
      {/* Atmospheric backdrop - matching hero-section.tsx */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(145,120,255,0.28),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(197,122,255,0.18),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_35%,rgba(120,176,255,0.14),transparent_60%)]" />
      <div className="absolute -top-24 right-[-12%] h-[520px] w-[520px] rounded-full bg-primary/15 blur-[140px]" />
      <div className="absolute -bottom-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-[170px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 md:px-16 pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-12 md:pb-16 min-h-[60vh] md:min-h-screen flex flex-col">
        <div className="flex-1 grid gap-8 sm:gap-10 lg:grid-cols-[1.05fr_1.3fr] lg:gap-16 items-start">
          {/* Left column - Text content */}
          <div className="max-w-xl h-full flex flex-col justify-center items-start space-y-5 animate-pulse">
            <div className="h-8 w-40 rounded-full bg-card" />
            <div className="space-y-3">
              <div className="h-12 md:h-16 w-4/5 rounded-lg bg-card" />
              <div className="h-12 md:h-16 w-3/5 rounded-lg bg-card" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-full max-w-md rounded bg-card" />
              <div className="h-5 w-2/3 rounded bg-card" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-12 w-44 rounded-full bg-primary" />
              <div className="h-12 w-36 rounded-full bg-card" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-16 rounded-2xl bg-card ${i === 2 ? "hidden sm:block" : ""}`}
                />
              ))}
            </div>
          </div>

          {/* Right column - Persona grid (2x2) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 auto-rows-[minmax(220px,1fr)] sm:auto-rows-[minmax(180px,1fr)] lg:auto-rows-auto lg:grid-rows-2 h-auto lg:h-[calc(100vh-10rem)] animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`h-full rounded-3xl bg-card ${i >= 2 ? "hidden sm:block" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
