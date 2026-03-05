import { Skeleton } from "@/components/ui/skeleton";

export default function PredictLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-lg" />
      ))}
    </div>
  );
}
