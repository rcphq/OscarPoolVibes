"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="size-12 text-destructive" />
        <h2 className="text-2xl font-heading font-bold">Admin Error</h2>
        <p className="max-w-md text-muted-foreground">
          {error.message || "Something went wrong in the admin panel."}
        </p>
      </div>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
