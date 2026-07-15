import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Landmark } from "lucide-react";
import { DocumentCard } from "@/components/kredal/document-card";
import { getCompany } from "@/lib/data/companies";
import { getCompanyDocuments } from "@/lib/data/documents";
import { requiredDocsFor } from "@/lib/checklist";
import type { CompanyDocument, DocumentType } from "@/lib/types";

export default async function CompanyDocumentsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = await getCompany(companyId);
  if (!company) notFound();

  const documents = await getCompanyDocuments(companyId);
  const byType = documents.reduce<Record<string, CompanyDocument[]>>((acc, doc) => {
    (acc[doc.document_type] ??= []).push(doc);
    return acc;
  }, {});

  const checklist = requiredDocsFor(company);
  const requiredDone = checklist.required.filter(
    (t) => (byType[t]?.length ?? 0) > 0
  ).length;

  return (
    <div className="space-y-6">
      <Link
        href={`/app/companies/${companyId}`}
        className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        {company.legal_name}
      </Link>

      <div>
        <h1 className="text-h1 font-semibold">Documents</h1>
        <p className="text-body-sm text-muted-foreground">
          {requiredDone} of {checklist.required.length} required documents
          uploaded
          {company.target_bank ? ` (checklist tailored to ${company.target_bank})` : ""}.
          PDF, PNG, or JPG — up to 15MB each.
        </p>
      </div>

      {checklist.bankNote ? (
        <p className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-body-sm text-muted-foreground">
          <Landmark className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
          {company.target_bank}: {checklist.bankNote}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold">Required</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {checklist.required.map((type: DocumentType) => (
            <DocumentCard
              key={type}
              companyId={companyId}
              documentType={type}
              required
              documents={byType[type] ?? []}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold">Optional</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {checklist.optional.map((type: DocumentType) => (
            <DocumentCard
              key={type}
              companyId={companyId}
              documentType={type}
              required={false}
              documents={byType[type] ?? []}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
