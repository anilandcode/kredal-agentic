import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyStatusBadge } from "@/components/kredal/status-badge";
import {
  ProgressChecklist,
  type ChecklistStep,
} from "@/components/kredal/progress-checklist";
import { getCompany } from "@/lib/data/companies";
import { getCompanyDocuments } from "@/lib/data/documents";
import { getCompletedSections } from "@/lib/data/questionnaire";
import { getLatestAssessment } from "@/lib/data/assessments";
import { getCompanyReports } from "@/lib/data/reports";
import { BASE_REQUIRED_DOCUMENT_TYPES, JURISDICTION_LABELS, QUESTIONNAIRE_SECTIONS } from "@/lib/constants";

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 text-body-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = await getCompany(companyId);
  if (!company) notFound();

  const [documents, completedSections, assessment, reports] = await Promise.all([
    getCompanyDocuments(companyId),
    getCompletedSections(companyId),
    getLatestAssessment(companyId),
    getCompanyReports(companyId),
  ]);

  const uploadedTypes = new Set(documents.map((d) => d.document_type));
  const requiredUploaded = BASE_REQUIRED_DOCUMENT_TYPES.filter((t) =>
    uploadedTypes.has(t)
  ).length;
  const documentsDone = requiredUploaded >= BASE_REQUIRED_DOCUMENT_TYPES.length;
  const questionnaireDone = completedSections.size >= QUESTIONNAIRE_SECTIONS.length;

  const steps: ChecklistStep[] = [
    { key: "profile", label: "Company profile", state: "done" },
    {
      key: "documents",
      label: `Documents (${requiredUploaded}/${BASE_REQUIRED_DOCUMENT_TYPES.length} required)`,
      href: `/app/companies/${companyId}/documents`,
      state: documentsDone ? "done" : "current",
    },
    {
      key: "questionnaire",
      label: `Questionnaire (${completedSections.size}/${QUESTIONNAIRE_SECTIONS.length} sections)`,
      href: `/app/companies/${companyId}/questionnaire`,
      state: questionnaireDone ? "done" : completedSections.size > 0 ? "current" : "upcoming",
    },
    {
      key: "assessment",
      label: assessment
        ? `Assessment (score: ${assessment.overall_score})`
        : "Rejection-risk assessment",
      href: `/app/companies/${companyId}/assessment`,
      state: assessment ? "done" : "current",
    },
    {
      key: "report",
      label: "Bank application pack",
      href: `/app/companies/${companyId}/reports`,
      state: reports.length > 0 ? "done" : assessment ? "current" : "upcoming",
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Companies
      </Link>

      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-h1 font-semibold">{company.legal_name}</h1>
            <CompanyStatusBadge status={company.status} />
          </div>
          <p className="text-body-sm text-muted-foreground">
            {JURISDICTION_LABELS[company.jurisdiction_type]}
            {company.emirate ? ` · ${company.emirate}` : ""}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/app/companies/${companyId}/edit`}>
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-2 text-h3 font-semibold">Company details</h2>
            <SummaryRow label="Trade license number" value={company.trade_license_number} />
            <SummaryRow label="Authority / free zone" value={company.authority_name} />
            <SummaryRow
              label="License activity codes"
              value={company.license_activity_codes?.join(", ")}
            />
            <SummaryRow label="Incorporation date" value={company.incorporation_date} />
            <SummaryRow label="Office / lease status" value={company.office_status} />
            <SummaryRow label="Owner nationality" value={company.owner_nationality} />
            <SummaryRow
              label="Owner UAE residency status"
              value={company.owner_uae_residency_status}
            />
            <SummaryRow
              label="Expected monthly turnover"
              value={
                company.expected_monthly_turnover_aed
                  ? `AED ${Number(company.expected_monthly_turnover_aed).toLocaleString("en-AE")}`
                  : null
              }
            />
            <SummaryRow label="Target bank" value={company.target_bank} />
            <SummaryRow label="Target account type" value={company.target_account_type} />
          </div>
        </div>

        <div>
          <ProgressChecklist steps={steps} />
        </div>
      </div>
    </div>
  );
}
