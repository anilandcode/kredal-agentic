"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renameWorkspace, type RenameWorkspaceState } from "@/app/actions/workspace";

const initialState: RenameWorkspaceState = {};

export function RenameWorkspaceForm({
  workspaceId,
  currentName,
}: {
  workspaceId: string;
  currentName: string;
}) {
  const [state, formAction, pending] = useActionState(
    renameWorkspace.bind(null, workspaceId),
    initialState
  );

  return (
    <form action={formAction} className="flex max-w-md items-end gap-2">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="workspace_name">Workspace name</Label>
        <Input
          id="workspace_name"
          name="name"
          defaultValue={currentName}
          required
        />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rename"}
      </Button>
      {state.error ? (
        <span className="flex items-center gap-1 pb-2 text-caption text-risk-high">
          <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
          {state.error}
        </span>
      ) : null}
      {state.message ? (
        <span className="flex items-center gap-1 pb-2 text-caption text-risk-low">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
