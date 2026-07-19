import {
  BANK_ADDITIONAL_REQUIRED,
  HIGH_MIN_BALANCE_BANKS,
  type ScoringInput,
} from "@/lib/scoring/rules";
import {
  BASE_REQUIRED_DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/constants";
import type { DocumentType } from "@/lib/types";

/**
 * Agent 9 — bank-matcher. Ranks the supported banks for a given company file
 * using the same deterministic signals the scoring engine uses (bank document
 * additions, minimum-balance posture, company age, source-of-funds evidence).
 * Guidance only: the output ranks *readiness fit*, it never promises approval.
 */

export interface BankMatch {
  bank: string;
  /** 0–100 readiness-fit score for this bank, from this file as it is today. */
  score: number;
  /** Positive signals worth telling the founder. */
  reasons: string[];
  /** Concrete gaps that would weaken an application to this bank. */
  blockers: string[];
}

function hasDoc(input: ScoringInput, type: string): boolean {
  return input.documents.some(
    (d) => d.document_type === type && d.status !== "rejected"
  );
}

function monthsSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / (1000 * 60 * 60 * 24 * 30);
}

const label = (t: string) => DOCUMENT_TYPE_LABELS[t as DocumentType] ?? t;

export function matchBanks(input: ScoringInput): BankMatch[] {
  const turnover = input.company.expected_monthly_turnover_aed;
  const age = monthsSince(input.company.incorporation_date);
  const sofEvidenceNo =
    input.answers.source_of_funds_evidence_available === "no";
  const missingBase = (BASE_REQUIRED_DOCUMENT_TYPES as readonly string[]).filter(
    (t) => !hasDoc(input, t)
  );

  const matches = Object.entries(BANK_ADDITIONAL_REQUIRED).map(
    ([bank, extras]) => {
      let score = 100;
      const reasons: string[] = [];
      const blockers: string[] = [];

      const missingExtras = extras.filter((t) => !hasDoc(input, t));
      for (const t of missingExtras) {
        score -= 12;
        blockers.push(`${bank} also requires: ${label(t)} — not uploaded yet.`);
      }
      if (extras.length === 0) {
        reasons.push("No bank-specific document additions.");
      } else if (missingExtras.length === 0) {
        reasons.push(`All ${bank}-specific documents are on file.`);
      }

      // Base checklist gaps weaken every application equally.
      score -= Math.min(missingBase.length * 6, 24);
      if (missingBase.length > 0) {
        blockers.push(
          `${missingBase.length} base required document(s) still missing.`
        );
      }

      if (HIGH_MIN_BALANCE_BANKS.has(bank)) {
        if (turnover != null && turnover < 50000) {
          score -= 25;
          blockers.push(
            "Positions itself for higher balances — stated turnover is below the comfortable range."
          );
        } else if (turnover == null) {
          score -= 10;
          blockers.push(
            "Expected turnover not stated — higher-balance banks will ask."
          );
        } else {
          reasons.push("Stated turnover fits this bank's balance posture.");
        }
      } else {
        reasons.push("No high minimum-balance posture.");
      }

      if (age != null && age < 3) {
        score -= 10;
        blockers.push(
          "Company is younger than 3 months — expect enhanced review."
        );
      }

      if (sofEvidenceNo && extras.includes("source_of_funds_evidence")) {
        score -= 8;
        blockers.push(
          "This bank scrutinises source of funds and no evidence is available yet."
        );
      }

      return {
        bank,
        score: Math.max(0, Math.min(100, score)),
        reasons,
        blockers,
      };
    }
  );

  return matches.sort((a, b) => b.score - a.score);
}
