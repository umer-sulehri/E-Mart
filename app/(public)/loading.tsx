import { Leaf } from 'lucide-react';

export default function PublicLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <Leaf className="h-8 w-8 animate-pulse text-primary" />
          <span className="text-2xl font-bold font-heading text-secondary-800">
            E-Mart
          </span>
        </div>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </div>
  );
}
