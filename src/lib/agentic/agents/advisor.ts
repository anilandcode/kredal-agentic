import { buildReport } from "@/lib/reports/templates";
import { buildRecoveryPlan, type RecoveryPlan } from "@/lib/reports/recovery-advisor";
import { SCORING_VERSION } from "@/lib/scoring/engine";
import type { ScoringInput } from "@/lib/scoring/rules";
import type { RunLog } from "../events";
import type { Verdicts } from "./judge";

/**
 * Advisor: what the founder should do next, and the pack they take to the bank.
 * Built on Kredal's existing report templates and rejection-recovery playbook —
 * deterministic, so the advice follows from the findings and nothing else.
 */

export interface Advice {
  /** Ordered: questions only a person can answer first, then fixes, then advisories. */
  nextActions: string[];
  recovery: RecoveryPlan | null;
  packMarkdown: string;
}

export function advise(input: ScoringInput, verdicts: Verdicts, log: RunLog): Advice {
  log.emit("advisor", "stage", "Drafting the fix plan and the bank application pack.");
  const r = verdicts.range.asExtracted;

  // Findings that no published rule scores, but a bank officer would notice —
  // e.g. a statement in the owner's personal name. Advice, not deductions.
  const advisories = verdicts.decisions
    .filter((d) => d.action === "act" && d.judgment.ruleIds.length === 0 && d.judgment.verdict === false)
    .map((d) =>
      d.judgment.id === "account.holder_vs_company"
        ? `The bank statement is a personal account, not the company's. Banks read company turnover from a company account — open one, or explain why the personal account carries business income.${d.judgment.rationale ? ` (${d.judgment.rationale})` : ""}`
        : `${d.judgment.question} — no.${d.judgment.rationale ? ` ${d.judgment.rationale}` : ""}`
    );

  const nextActions = [
    ...verdicts.questions.map((q) => `Confirm: ${q.judgment.question}`),
    ...r.recommendations,
    ...advisories,
  ];

  const reason =
    typeof input.answers.rejection_reason === "string" ? input.answers.rejection_reason.trim() : "";
  const recovery =
    input.answers.previously_rejected === "yes" && reason ? buildRecoveryPlan(reason, r.flags) : null;

  const packMarkdown = buildReport("bank_application_pack", {
    company: input.company,
    owners: input.owners,
    documents: input.documents,
    answers: input.answers,
    assessment: {
      id: "agentic",
      company_id: input.company.id,
      overall_score: r.overallScore,
      risk_level: r.riskLevel,
      category_scores: r.categoryScores,
      flags: r.flags,
      recommendations: r.recommendations,
      scoring_version: SCORING_VERSION,
      created_by: "kredal-agents",
      created_at: new Date().toISOString(),
    },
  });

  log.emit("advisor", "result", `${nextActions.length} next actions${recovery ? "; rejection-recovery plan included" : ""}.`, {
    nextActions: nextActions.slice(0, 8),
    recovery: recovery ? { cause: recovery.causeLabel, timeline: recovery.timeline } : null,
  });
  return { nextActions, recovery, packMarkdown };
}
