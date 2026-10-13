"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { geminiConfigured, geminiGenerate } from "@/lib/ai/gemini";
import { getCompany, getCompanyOwners } from "@/lib/data/companies";
import { getQuestionnaireAnswers } from "@/lib/data/questionnaire";

export interface NarrativeActionState {
  draft?: string;
  error?: string;
}

/**
 * Drafts a source-of-funds narrative from the founder's own questionnaire
 * answers. The draft is returned for the founder to review and edit — it is
 * NEVER saved automatically, and it never affects the deterministic score.
 */
export async function draftSourceOfFundsNarrative(
  companyId: string,
  _prevState: NarrativeActionState,
  _formData: FormData
): Promise<NarrativeActionState> {
  if (!geminiConfigured()) {
    return {
      error:
        "AI drafting is not enabled on this deployment (GEMINI_API_KEY is not set).",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  // RLS-gated reads double as the access check.
  const company = await getCompany(companyId);
  if (!company) return { error: "Company not found." };
  const [owners, answers] = await Promise.all([
    getCompanyOwners(companyId),
    getQuestionnaireAnswers(companyId),
  ]);

  const facts = {
    company: company.legal_name,
    jurisdiction: company.jurisdiction_type,
    expected_monthly_turnover_aed: company.expected_monthly_turnover_aed,
    owners: owners.map((o) => ({
      name: o.full_name,
      nationality: o.nationality,
      ownership_percentage: o.ownership_percentage,
      uae_residency: o.uae_residency_status,
    })),
    existing_explanation: answers.source_of_funds_explanation ?? null,
    evidence_available: answers.source_of_funds_evidence_available ?? null,
    business_activity: answers.actual_activity_description ?? null,
    high_risk_corridor: answers.high_risk_corridor ?? null,
    corridor_narrative: answers.high_risk_corridor_narrative ?? null,
  };

  const prompt = `You are helping a UAE SME founder draft a source-of-funds narrative for a
bank account application. Write in first person, plain professional English, 90-150 words,
one paragraph. Use ONLY the facts below — never invent amounts, dates, employers, or
documents that are not stated. If the facts are too thin to write a credible narrative,
write what can be supported and note in [brackets] what the founder should add.

Facts (JSON):
${JSON.stringify(facts, null, 2)}

Rules:
- No guarantees or promises of approval.
- Do not mention this platform or AI.
- Refer to evidence generically ("bank statements", "salary certificates") only if
  evidence_available is "yes".

Return only the narrative text, no preamble.`;

  try {
    const draft = (await geminiGenerate([{ text: prompt }], { temperature: 0.3 }))
      .trim();

    await logAuditEvent(supabase, {
      userId: user.id,
      companyId,
      eventType: "narrative_drafted",
      eventData: { kind: "source_of_funds" },
    });

    return { draft };
  } catch {
    return { error: "AI drafting is temporarily unavailable. Try again in a minute." };
  }
}
