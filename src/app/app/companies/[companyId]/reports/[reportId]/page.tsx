import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarkdownReport } from "@/components/kredal/markdown-report";
import { ReportActions } from "@/components/kredal/report-actions";
import { getReport } from "@/lib/data/reports";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ companyId: string; reportId: string }>;
}) {
  const { companyId, reportId } = await params;
  const report = await getReport(reportId);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/app/companies/${companyId}/reports`}
        className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Reports
      </Link>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-h1 font-semibold">{report.title}</h1>
        <ReportActions
          content={report.content_markdown}
          filename={`${report.title.replace(/[^a-z0-9]+/gi, "_")}.md`}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-8">
        <MarkdownReport content={report.content_markdown} />
      </div>
    </div>
  );
}
