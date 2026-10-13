"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDocument } from "@/app/actions/documents";

export function DeleteDocumentButton({
  companyId,
  documentId,
  storagePath,
  filename,
}: {
  companyId: string;
  documentId: string;
  storagePath: string;
  filename: string;
}) {
  return (
    <form
      action={() => deleteDocument(companyId, documentId, storagePath)}
      onSubmit={(e) => {
        if (!confirm(`Delete ${filename}?`)) e.preventDefault();
      }}
    >
      <Button
        type="submit"
        size="icon-sm"
        variant="ghost"
        aria-label={`Delete ${filename}`}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </Button>
    </form>
  );
}
