export function PersonasSkeleton() {
  return (
    <section className="relative py-20 md:py-24 px-5 sm:px-6 md:px-16 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-card rounded-lg animate-pulse" />
            <div className="h-5 w-48 bg-card rounded animate-pulse" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-3xl overflow-hidden bg-card/60 animate-pulse ${
                i < 2 ? "h-[360px] sm:h-[500px]" : "h-[300px] sm:h-[400px]"
              }`}
            >
              {/* Gradient shimmer */}
              <div className="w-full h-full bg-gradient-to-b from-card/80 to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
