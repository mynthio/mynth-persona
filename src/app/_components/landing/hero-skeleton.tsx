export function HeroSkeleton() {
  return (
    <section className="relative w-full h-[100svh] overflow-hidden bg-black">
      {/* Shimmer background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 animate-pulse" />

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      {/* Content skeleton */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 pb-24 md:pb-32">
        <div className="max-w-2xl space-y-4">
          {/* Badge skeleton */}
          <div className="h-5 w-24 bg-white/10 rounded-full animate-pulse" />

          {/* Title skeleton */}
          <div className="space-y-2">
            <div className="h-14 md:h-20 w-3/4 bg-white/10 rounded-lg animate-pulse" />
          </div>

          {/* Subtitle skeleton */}
          <div className="space-y-2 pt-2">
            <div className="h-6 w-full max-w-xl bg-white/10 rounded animate-pulse" />
            <div className="h-6 w-2/3 bg-white/10 rounded animate-pulse" />
          </div>

          {/* Button skeleton */}
          <div className="pt-4">
            <div className="h-14 w-48 bg-white/20 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Progress indicators skeleton */}
      <div className="absolute bottom-24 md:bottom-32 right-8 md:right-16 flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-1 h-12 rounded-full bg-white/20 animate-pulse"
          />
        ))}
      </div>
    </section>
  );
}
