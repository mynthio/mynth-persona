import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <Skeleton className="aspect-square w-full rounded-xl border border-border" />
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
