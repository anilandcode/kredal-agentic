import { CheckCircle2, Circle, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { DocumentUploadForm } from "@/components/kredal/document-upload-form";
import { DeleteDocumentButton } from "@/components/kredal/delete-document-button";
import { uploadDocument, createSignedDocumentUrl } from "@/app/actions/documents";
import type { CompanyDocument, DocumentStatus, DocumentType } from "@/lib/types";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  uploaded: "bg-info/10 text-info",
  parsed: "bg-info/10 text-info",
  needs_review: "bg-risk-medium-bg text-risk-medium-foreground",
  accepted: "bg-risk-low-bg text-risk-low-foreground",
  rejected: "bg-risk-high-bg text-risk-high-foreground",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  uploaded: "Uploaded",
  parsed: "Parsed",
  needs_review: "Needs review",
  accepted: "Accepted",
  rejected: "Rejected",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isExpiringSoon(expiryDate: string | null) {
  if (!expiryDate) return false;
  const days = (new Date(expiryDate).getTime() - Date.now()) / 86_400_000;
  return days >= 0 && days < 60;
}

export function DocumentCard({
  companyId,
  documentType,
  required,
  documents,
}: {
  companyId: string;
  documentType: DocumentType;
  required: boolean;
  documents: CompanyDocument[];
}) {
  const hasDocument = documents.length > 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {hasDocument ? (
            <CheckCircle2 className="h-4 w-4 text-risk-low" strokeWidth={1.5} />
          ) : (
            <Circle className="h-4 w-4 text-border" strokeWidth={1.5} />
          )}
          <span className="text-body-sm font-medium">
            {DOCUMENT_TYPE_LABELS[documentType]}
          </span>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-caption font-medium",
            required
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {required ? "Required" : "Optional"}
        </span>
      </div>

      {documents.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm">{doc.original_filename}</p>
                <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                  <span>{formatDate(doc.created_at)}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 font-medium",
                      STATUS_STYLES[doc.status]
                    )}
                  >
                    {STATUS_LABELS[doc.status]}
                  </span>
                  {isExpiringSoon(doc.expiry_date) ? (
                    <span className="flex items-center gap-1 font-medium text-risk-medium">
                      <Clock className="h-3 w-3" strokeWidth={1.5} />
                      Expires {formatDate(doc.expiry_date!)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <form action={createSignedDocumentUrl.bind(null, doc.storage_path)}>
                  <button
                    type="submit"
                    aria-label={`Preview ${doc.original_filename}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </form>
                <DeleteDocumentButton
                  companyId={companyId}
                  documentId={doc.id}
                  storagePath={doc.storage_path}
                  filename={doc.original_filename}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <DocumentUploadForm action={uploadDocument.bind(null, companyId, documentType)} />
    </div>
  );
}
