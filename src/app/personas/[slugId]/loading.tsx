export default function Loading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 animate-pulse">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <div className="aspect-square w-full rounded-xl border border-border bg-muted" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-8 w-2/3 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}