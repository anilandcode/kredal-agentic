import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { QuestionnaireApp } from "@/components/kredal/questionnaire/questionnaire-app";
import { getCompany, getCompanyOwners } from "@/lib/data/companies";
import { getQuestionnaireAnswers, getCompletedSections } from "@/lib/data/questionnaire";

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = await getCompany(companyId);
  if (!company) notFound();

  const [answers, completedSections, owners] = await Promise.all([
    getQuestionnaireAnswers(companyId),
    getCompletedSections(companyId),
    getCompanyOwners(companyId),
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
        <h1 className="text-h1 font-semibold">Readiness questionnaire</h1>
        <p className="text-body-sm text-muted-foreground">
          Answers are saved per section and feed your rejection-risk assessment.
        </p>
      </div>

      <QuestionnaireApp
        companyId={companyId}
        answers={answers}
        owners={owners}
        initialCompletedSections={[...completedSections]}
      />
    </div>
  );
}
