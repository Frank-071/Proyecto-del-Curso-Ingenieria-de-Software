export function LoadingSkeleton() {
  return (
    <div className="w-full space-y-16">
      {/* Carousel Skeleton */}
      <section className="relative w-full h-[80vh] bg-muted animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-64 h-12 bg-muted-foreground/20 rounded mx-auto"></div>
            <div className="w-48 h-6 bg-muted-foreground/20 rounded mx-auto"></div>
          </div>
        </div>
      </section>

      {/* Events Grid Skeleton */}
      <section className="container mx-auto px-4 space-y-12">
        <div className="space-y-4">
          <div className="w-48 h-10 bg-muted animate-pulse rounded"></div>
          <div className="w-64 h-6 bg-muted animate-pulse rounded"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="w-full h-[280px] bg-muted animate-pulse rounded-xl"></div>
              <div className="space-y-2">
                <div className="w-3/4 h-6 bg-muted animate-pulse rounded"></div>
                <div className="w-1/2 h-4 bg-muted animate-pulse rounded"></div>
                <div className="w-2/3 h-4 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}