import { Skeleton } from "@/components/ui/skeleton";

export default function InvitesLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
