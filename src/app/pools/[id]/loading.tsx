import { Skeleton } from "@/components/ui/skeleton";

export default function PoolDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-5 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
