export function HeroSkeleton() {
  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 animate-pulse" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-16 pt-20 md:pt-28 pb-16 md:pb-24">
        <div className="grid lg:grid-cols-[1.05fr_1.3fr] gap-10 lg:gap-16 items-center">
          <div className="space-y-5">
            <div className="h-8 w-40 rounded-full bg-white/10 animate-pulse" />
            <div className="space-y-3">
              <div className="h-12 md:h-16 w-4/5 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-12 md:h-16 w-3/5 rounded-lg bg-white/10 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-full max-w-md rounded bg-white/10 animate-pulse" />
              <div className="h-5 w-2/3 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-12 w-44 rounded-full bg-white/20 animate-pulse" />
              <div className="h-12 w-36 rounded-full bg-white/10 animate-pulse" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-white/10 animate-pulse"
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-[28px] bg-white/10 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
