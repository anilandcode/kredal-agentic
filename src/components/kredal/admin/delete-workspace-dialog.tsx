"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteWorkspace } from "@/app/actions/admin";

export function DeleteWorkspaceDialog({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onDelete = () =>
    startTransition(async () => {
      setError(null);
      const result = await deleteWorkspace(workspaceId, confirmName);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setConfirmName("");
      }
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete workspace</DialogTitle>
          <DialogDescription>
            This permanently deletes <strong>{workspaceName}</strong> — its
            members, companies, documents, assessments, reports, and stored
            files. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-body-sm text-muted-foreground">
            Type <span className="font-medium text-foreground">{workspaceName}</span> to
            confirm.
          </p>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={workspaceName}
            autoComplete="off"
          />
          {error ? (
            <p className="text-body-sm text-destructive">{error}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={pending || confirmName.trim() !== workspaceName}
          >
            {pending ? "Deleting…" : "Delete workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
