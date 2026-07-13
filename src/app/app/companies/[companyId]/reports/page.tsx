import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Gauge, Sparkles } from "lucide-react";
import { SubmitButton } from "@/components/kredal/submit-button";
import { EmptyState } from "@/components/kredal/empty-state";
import { DisclaimerBanner } from "@/components/kredal/disclaimer-banner";
import { generateReport } from "@/app/actions/reports";
import { getCompany } from "@/lib/data/companies";
import { getLatestAssessment } from "@/lib/data/assessments";
import { getCompanyReports } from "@/lib/data/reports";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  founder_readiness: "Founder readiness report",
  bank_application_pack: "Bank application pack",
  consultant_checklist: "Consultant checklist",
  rejection_recovery_pack: "Rejection recovery pack",
};

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = await getCompany(companyId);
  if (!company) notFound();

  const [assessment, reports] = await Promise.all([
    getLatestAssessment(companyId),
    getCompanyReports(companyId),
  ]);

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
        <h1 className="text-h1 font-semibold">Reports</h1>
        <p className="text-body-sm text-muted-foreground">
          Generate a report from your latest assessment, then copy or export it.
        </p>
      </div>

      <DisclaimerBanner />

      {!assessment ? (
        <EmptyState
          icon={Gauge}
          title="Run an assessment first"
          description="Reports are generated from your latest readiness assessment."
          action={
            <Link
              href={`/app/companies/${companyId}/assessment`}
              className="text-body-sm font-medium text-primary hover:underline"
            >
              Go to assessment →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <FileText className="mb-2 h-5 w-5 text-primary" strokeWidth={1.5} />
            <h2 className="text-h3 font-semibold">Founder readiness report</h2>
            <p className="mb-4 text-body-sm text-muted-foreground">
              Score, risks, fixes, and next steps — for you to review.
            </p>
            <form action={generateReport.bind(null, companyId, "founder_readiness")}>
              <SubmitButton size="sm" variant="secondary">
                Generate
              </SubmitButton>
            </form>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <Sparkles className="mb-2 h-5 w-5 text-primary" strokeWidth={1.5} />
            <h2 className="text-h3 font-semibold">Bank application pack</h2>
            <p className="mb-4 text-body-sm text-muted-foreground">
              A document-prepared pack ready to bring to the bank.
            </p>
            <form action={generateReport.bind(null, companyId, "bank_application_pack")}>
              <SubmitButton size="sm" variant="secondary">
                Generate
              </SubmitButton>
            </form>
          </div>
        </div>
      )}

      {reports.length > 0 ? (
        <div>
          <h2 className="mb-3 text-h3 font-semibold">Generated reports</h2>
          <div className="space-y-2">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/app/companies/${companyId}/reports/${report.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-muted/50"
              >
                <div>
                  <p className="text-body-sm font-medium">{report.title}</p>
                  <p className="text-caption text-muted-foreground">
                    {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type} ·{" "}
                    {formatDate(report.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
