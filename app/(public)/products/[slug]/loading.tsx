import Skeleton from '@/components/ui/Skeleton';

export default function ProductDetailLoading() {
  return (
    <section className="py-8 lg:py-12">
      <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <Skeleton variant="text" width={280} height={16} />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Gallery skeleton */}
          <div className="space-y-4">
            <Skeleton variant="rectangle" height={420} className="w-full" />
            <div className="flex justify-center gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rectangle" height={72} width={72} />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="space-y-4">
            <Skeleton variant="text" width="60%" height={28} />
            <Skeleton variant="text" width="35%" height={20} />
            <Skeleton variant="rectangle" height={120} className="w-full" />
            <Skeleton variant="rectangle" height={48} className="w-1/2" />
            <Skeleton variant="rectangle" height={260} className="w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}