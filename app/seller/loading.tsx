import Skeleton from '@/components/ui/Skeleton';

export default function SellerLoading() {
  return (
    <div className="min-h-screen bg-muted-50 p-4 lg:p-6">
      <div className="flex gap-6">
        {/* Sidebar skeleton */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
            <Skeleton variant="circle" width={48} height={48} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="80%" />
            <div className="space-y-3 pt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="text" width="100%" height={36} className="rounded-lg" />
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Header skeleton */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width={200} height={32} />
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" width={36} height={36} />
                <Skeleton variant="circle" width={36} height={36} />
              </div>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="mt-4">
            <Skeleton variant="text" width={180} height={16} />
          </div>

          {/* Content skeleton */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
                <Skeleton variant="text" width="50%" height={14} />
                <Skeleton variant="text" width="70%" height={28} className="mt-2" />
                <Skeleton variant="text" width="40%" height={12} className="mt-2" />
                <div className="mt-4 h-2 rounded-full bg-muted-100">
                  <Skeleton variant="rectangle" width="60%" height={8} className="rounded-full" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <Skeleton variant="text" width={150} height={24} className="mb-6" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-muted-100 py-4 last:border-b-0">
                <Skeleton variant="rectangle" width={60} height={60} className="rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="25%" />
                </div>
                <Skeleton variant="text" width={80} height={32} className="rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
