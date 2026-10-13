"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deactivateUser, reactivateUser } from "@/app/actions/admin";

export function AdminUserActions({
  userId,
  banned,
  isSelf,
}: {
  userId: string;
  banned: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return <span className="text-caption text-muted-foreground">You</span>;
  }

  const act = () =>
    startTransition(async () => {
      setError(null);
      const result = banned
        ? await reactivateUser(userId)
        : await deactivateUser(userId);
      if (result.error) setError(result.error);
    });

  return (
    <div className="flex items-center justify-end gap-2">
      {error ? (
        <span className="text-caption text-destructive">{error}</span>
      ) : null}
      <Button variant="outline" size="sm" disabled={pending} onClick={act}>
        {pending ? "Working…" : banned ? "Reactivate" : "Deactivate"}
      </Button>
    </div>
  );
}
