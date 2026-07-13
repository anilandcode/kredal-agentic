"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-risk-medium" strokeWidth={1.5} />
      <div className="space-y-1">
        <p className="text-body font-medium">Something went wrong</p>
        <p className="text-body-sm text-muted-foreground">
          Your data is safe. Try again, or head back to your dashboard.
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={reset}>
          Try again
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href="/app">Back to dashboard</a>
        </Button>
      </div>
    </div>
  );
}
