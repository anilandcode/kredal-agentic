"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentActionState } from "@/app/actions/documents";

const initialState: DocumentActionState = {};

export function DocumentUploadForm({
  action,
}: {
  action: (
    state: DocumentActionState,
    formData: FormData
  ) => Promise<DocumentActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="file"
          name="file"
          required
          accept=".pdf,.png,.jpg,.jpeg"
          className="block w-full flex-1 text-body-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-body-sm file:font-medium file:text-accent-foreground hover:file:bg-accent/80"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
              Upload
            </>
          )}
        </Button>
      </div>
      {state.error ? (
        <p className="flex items-center gap-1.5 text-caption text-risk-high">
          <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
