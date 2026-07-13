"use client";

import { useState } from "react";
import { SectionNav } from "@/components/kredal/questionnaire/section-nav";
import { SectionForm } from "@/components/kredal/questionnaire/section-form";
import { OwnersManager } from "@/components/kredal/questionnaire/owners-manager";
import { saveQuestionnaireSection } from "@/app/actions/questionnaire";
import { QUESTIONNAIRE_SCHEMA, getSectionTitle } from "@/lib/questionnaire/schema";
import { QUESTIONNAIRE_SECTIONS, type QuestionnaireSectionKey } from "@/lib/constants";
import type { CompanyOwner } from "@/lib/types";

export function QuestionnaireApp({
  companyId,
  answers,
  owners,
  initialCompletedSections,
}: {
  companyId: string;
  answers: Record<string, unknown>;
  owners: CompanyOwner[];
  initialCompletedSections: string[];
}) {
  const [activeSection, setActiveSection] = useState<QuestionnaireSectionKey>(
    QUESTIONNAIRE_SECTIONS[0].key
  );
  const [completedSections, setCompletedSections] = useState(
    () => new Set(initialCompletedSections)
  );

  const sectionIndex = QUESTIONNAIRE_SECTIONS.findIndex((s) => s.key === activeSection);
  const nextSection = QUESTIONNAIRE_SECTIONS[sectionIndex + 1];

  function markSavedAndAdvance() {
    setCompletedSections((prev) => new Set(prev).add(activeSection));
    if (nextSection) setActiveSection(nextSection.key);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <SectionNav
        activeSection={activeSection}
        completedSections={completedSections}
        onSelect={(s) => setActiveSection(s as QuestionnaireSectionKey)}
      />

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-5 text-h2 font-semibold">{getSectionTitle(activeSection)}</h2>

        {activeSection === "ubo_ownership" ? (
          <div className="space-y-8">
            <OwnersManager companyId={companyId} owners={owners} />
            <div className="border-t border-border pt-6">
              <SectionForm
                questions={QUESTIONNAIRE_SCHEMA.ubo_ownership}
                answers={answers}
                action={saveQuestionnaireSection.bind(null, companyId, activeSection)}
                onSaved={markSavedAndAdvance}
              />
            </div>
          </div>
        ) : (
          <SectionForm
            key={activeSection}
            questions={QUESTIONNAIRE_SCHEMA[activeSection]}
            answers={answers}
            action={saveQuestionnaireSection.bind(null, companyId, activeSection)}
            onSaved={markSavedAndAdvance}
          />
        )}
      </div>
    </div>
  );
}
