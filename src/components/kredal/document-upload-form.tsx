"use client";

import { useState, useActionState } from "react";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentActionState } from "@/app/actions/documents";

const initialState: DocumentActionState = {};
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export function DocumentUploadForm({
  action,
}: {
  action: (
    state: DocumentActionState,
    formData: FormData
  ) => Promise<DocumentActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [hasFile, setHasFile] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="file"
          name="file"
          required
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setHasFile(!!file);
            // Catch oversized files before submit — a >limit request would be
            // rejected at the transport layer with an unfriendly failure.
            setClientError(
              file && file.size > MAX_FILE_SIZE_BYTES
                ? "File is larger than 15MB."
                : null
            );
          }}
          className="block w-full flex-1 text-body-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-body-sm file:font-medium file:text-accent-foreground hover:file:bg-accent/80"
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={pending || !hasFile || clientError !== null}
        >
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
      <label className="flex items-center gap-2 text-caption text-muted-foreground">
        Expiry date (if the document has one)
        <input
          type="date"
          name="expiry_date"
          className="rounded-md border border-border bg-transparent px-2 py-1 text-caption"
        />
      </label>
      {clientError || state.error ? (
        <p className="flex items-center gap-1.5 text-caption text-risk-high">
          <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
          {clientError ?? state.error}
        </p>
      ) : null}
    </form>
  );
}
