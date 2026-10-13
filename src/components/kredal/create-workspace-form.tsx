"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  createWorkspace,
  type WorkspaceActionState,
} from "@/app/actions/workspace";

const initialState: WorkspaceActionState = {};

export function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(
    createWorkspace,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="e.g. Anil's Trading LLC, or Al Falah Advisory"
        />
      </div>

      <div className="space-y-2">
        <Label>Who is this for?</Label>
        <RadioGroup
          name="workspace_type"
          defaultValue="single_company"
          className="gap-3"
        >
          <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-3 text-body-sm has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="single_company" id="single_company" className="mt-0.5" />
            <span>
              <span className="block font-medium">My own company</span>
              <span className="block text-muted-foreground">
                One SME you&apos;re preparing for a bank.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-3 text-body-sm has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="consultant" id="consultant" className="mt-0.5" />
            <span>
              <span className="block font-medium">Consultant / accountant</span>
              <span className="block text-muted-foreground">
                Multiple client companies in one workspace.
              </span>
            </span>
          </label>
        </RadioGroup>
      </div>

      {state.error ? (
        <p className="flex items-start gap-2 rounded-md border border-risk-high/30 bg-risk-high-bg px-3 py-2 text-sm text-risk-high-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create workspace"}
      </Button>
    </form>
  );
}
