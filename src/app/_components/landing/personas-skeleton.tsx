import { Skeleton } from "@/components/ui/skeleton";

export function PersonasSkeleton() {
  return (
    <section className="relative py-20 md:py-24 px-5 sm:px-6 md:px-16 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-end justify-between mb-12">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`rounded-3xl ${
                i < 2 ? "h-[360px] sm:h-[500px]" : "h-[300px] sm:h-[400px]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
