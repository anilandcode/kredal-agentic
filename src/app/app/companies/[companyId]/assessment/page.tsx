import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gauge, RefreshCw } from "lucide-react";
import { ScoreGauge } from "@/components/kredal/score-gauge";
import { CategoryScoreBar } from "@/components/kredal/category-score-bar";
import { RiskCard } from "@/components/kredal/risk-card";
import { EmptyState } from "@/components/kredal/empty-state";
import { SubmitButton } from "@/components/kredal/submit-button";
import { DisclaimerBanner } from "@/components/kredal/disclaimer-banner";
import { runReadinessAssessment } from "@/app/actions/assessment";
import { getCompany } from "@/lib/data/companies";
import { getLatestAssessment } from "@/lib/data/assessments";
import type { ReadinessFlag } from "@/lib/types";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = await getCompany(companyId);
  if (!company) notFound();

  const assessment = await getLatestAssessment(companyId);
  const runAssessment = runReadinessAssessment.bind(null, companyId);

  return (
    <div className="space-y-6">
      <Link
        href={`/app/companies/${companyId}`}
        className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        {company.legal_name}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-semibold">Rejection-risk assessment</h1>
          <p className="text-body-sm text-muted-foreground">
            Deterministic scoring based on your documents, company profile, and questionnaire.
          </p>
        </div>
        <form action={runAssessment}>
          <SubmitButton variant={assessment ? "outline" : "default"}>
            {assessment ? (
              <>
                <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
                Re-run assessment
              </>
            ) : (
              "Run assessment"
            )}
          </SubmitButton>
        </form>
      </div>

      {!assessment ? (
        <EmptyState
          icon={Gauge}
          title="No assessment yet"
          description="Run your first readiness assessment to see your score, risk flags, and fixes."
        />
      ) : (
        <div className="space-y-6">
          <DisclaimerBanner />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-lg border border-border bg-card p-6">
                <ScoreGauge score={assessment.overall_score} riskLevel={assessment.risk_level} />
              </div>
              <div className="space-y-3 rounded-lg border border-border bg-card p-5">
                <h2 className="text-h3 font-semibold">Category scores</h2>
                {Object.entries(assessment.category_scores).map(([id, score]) => (
                  <CategoryScoreBar key={id} categoryId={id} score={score} />
                ))}
              </div>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <div>
                <h2 className="mb-3 text-h3 font-semibold">
                  Rejection risks & fixes ({assessment.flags.length})
                </h2>
                {assessment.flags.length === 0 ? (
                  <p className="text-body-sm text-muted-foreground">
                    No issues found — your file looks bank-ready.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(assessment.flags as ReadinessFlag[]).map((flag, i) => (
                      <RiskCard key={i} flag={flag} />
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h2 className="mb-2 text-h3 font-semibold">Recommendations</h2>
                <ul className="list-inside list-disc space-y-1 text-body-sm text-muted-foreground">
                  {assessment.recommendations.map((rec, i) => (
                    <li key={i}>{rec as string}</li>
                  ))}
                </ul>
              </div>

              <Link
                href={`/app/companies/${companyId}/reports`}
                className="inline-flex items-center gap-1.5 text-body-sm font-medium text-primary hover:underline"
              >
                Generate a bank application pack →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
