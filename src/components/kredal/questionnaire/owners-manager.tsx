"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { addOwner, deleteOwner, type OwnerActionState } from "@/app/actions/owners";
import type { CompanyOwner } from "@/lib/types";

const initialState: OwnerActionState = {};

export function OwnersManager({
  companyId,
  owners,
}: {
  companyId: string;
  owners: CompanyOwner[];
}) {
  const [state, formAction, pending] = useActionState(
    addOwner.bind(null, companyId),
    initialState
  );

  const totalOwnership = owners.reduce(
    (sum, o) => sum + (o.ownership_percentage ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-h3 font-semibold">Owners & UBOs</h3>
        <p className="text-body-sm text-muted-foreground">
          Add every shareholder. Ownership percentages should sum to 100%.
        </p>
      </div>

      {owners.length > 0 ? (
        <ul className="space-y-2">
          {owners.map((owner) => (
            <li
              key={owner.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="text-body-sm">
                <span className="font-medium">{owner.full_name}</span>
                {owner.nationality ? (
                  <span className="text-muted-foreground"> · {owner.nationality}</span>
                ) : null}
                {owner.ownership_percentage != null ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {owner.ownership_percentage}%
                  </span>
                ) : null}
                {owner.is_ubo ? (
                  <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-caption font-medium text-accent-foreground">
                    UBO
                  </span>
                ) : null}
              </div>
              <form action={() => deleteOwner(companyId, owner.id)}>
                <Button type="submit" size="icon-sm" variant="ghost" aria-label={`Remove ${owner.full_name}`}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}

      <p
        className={
          totalOwnership !== 100 && owners.length > 0
            ? "text-caption font-medium text-risk-medium"
            : "text-caption text-muted-foreground"
        }
      >
        Total ownership: {totalOwnership}%
        {totalOwnership !== 100 && owners.length > 0 ? " — should sum to 100%" : ""}
      </p>

      <form action={formAction} className="grid gap-3 rounded-lg border border-dashed border-border p-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nationality">Nationality</Label>
          <Input id="nationality" name="nationality" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ownership_percentage">Ownership %</Label>
          <Input id="ownership_percentage" name="ownership_percentage" type="number" min="0" max="100" />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox id="is_ubo" name="is_ubo" />
          <Label htmlFor="is_ubo" className="font-normal">
            This person is a Ultimate Beneficial Owner (owns/controls 25%+)
          </Label>
        </div>

        {state.error ? (
          <p className="flex items-start gap-2 rounded-md border border-risk-high/30 bg-risk-high-bg px-3 py-2 text-sm text-risk-high-foreground sm:col-span-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
            {state.error}
          </p>
        ) : null}

        <Button type="submit" size="sm" variant="secondary" disabled={pending} className="sm:col-span-2 sm:w-fit">
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Add owner
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
