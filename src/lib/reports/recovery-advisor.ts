import type { ReadinessFlag } from "@/lib/types";

/**
 * Agent 8 — rejection-recovery advisor. Deterministically maps a bank's
 * stated rejection reason (free text from the questionnaire) onto a known
 * cause and a targeted re-application plan, then merges the file's *current*
 * high-severity flags so the plan reflects today's file, not just the past.
 */

export type RejectionCause =
  | "documents"
  | "source_of_funds"
  | "activity_mismatch"
  | "ubo_ownership"
  | "minimum_balance"
  | "unknown";

export interface RecoveryPlan {
  cause: RejectionCause;
  causeLabel: string;
  steps: string[];
  timeline: string;
}

// Order matters: first match wins, so the more specific phrases come first.
const CAUSE_MATCHERS: { cause: RejectionCause; pattern: RegExp }[] = [
  {
    cause: "source_of_funds",
    pattern: /source of (funds|wealth)|sof\b|proof of (income|funds)|unexplained|deposit history/i,
  },
  {
    cause: "ubo_ownership",
    pattern: /\bubo\b|beneficial owner|sharehold|ownership|partner structure/i,
  },
  {
    cause: "minimum_balance",
    pattern: /minimum balance|average balance|low (balance|turnover)|relationship size|deposit requirement/i,
  },
  {
    cause: "activity_mismatch",
    pattern: /activit|nature of business|business model|licen[cs]e (scope|mismatch)|high[- ]risk (sector|business)/i,
  },
  {
    cause: "documents",
    // Includes inconsistency between documents — the most common rejection of
    // all ("the name on the licence did not match the application").
    pattern: /document|paperwork|incomplete|missing|expired|licen[cs]e cop|attestation|ejari|tenancy|inconsisten|mismatch|did ?n[o']?t match|does ?n[o']?t match|\bnames?\b[^.]*\bdiffer/i,
  },
];

const PLAYBOOK: Record<RejectionCause, { label: string; steps: string[]; timeline: string }> = {
  documents: {
    label: "Incomplete or inconsistent documents",
    steps: [
      "Complete every required item on the document checklist for your target bank — Kredal marks exactly which are missing.",
      "Check names, licence activity, and expiry dates match across every document before resubmitting.",
      "Replace any document expiring within 60 days — banks reject files that will go stale mid-review.",
    ],
    timeline: "1–2 weeks (document collection and re-verification)",
  },
  source_of_funds: {
    label: "Source-of-funds concerns",
    steps: [
      "Write a specific source-of-funds narrative: where the capital came from, over what period, with amounts.",
      "Attach evidence for each claim — savings statements, salary slips, sale agreements, prior bank statements.",
      "Upload the evidence as “Source-of-funds evidence” so it appears in your application pack.",
    ],
    timeline: "2–3 weeks (gathering statements takes the longest)",
  },
  activity_mismatch: {
    label: "Business activity concerns",
    steps: [
      "Align your described day-to-day activity with your trade-licence activity codes exactly.",
      "If your real operations differ from the licence, amend the licence before re-applying — not after.",
      "Replace generic descriptions (e.g. “general trading”) with specifics: products, counterparties, volumes.",
    ],
    timeline: "2–6 weeks (licence amendments depend on the authority)",
  },
  ubo_ownership: {
    label: "Ownership / UBO clarity",
    steps: [
      "List every shareholder with exact percentages summing to 100%.",
      "Prepare a signed UBO declaration for every owner at or above 25%.",
      "Ensure passports and the ownership register use identical name spellings.",
    ],
    timeline: "1–2 weeks",
  },
  minimum_balance: {
    label: "Balance / relationship-size mismatch",
    steps: [
      "Re-check your expected monthly turnover — if it is under AED 50,000, prioritise banks without a high minimum-balance posture.",
      "Use Kredal's bank-match ranking to pick the bank whose posture fits your file today.",
      "Consider starting with a digital-first account and upgrading once turnover is established.",
    ],
    timeline: "Immediate (re-target), or 3–6 months (build turnover history)",
  },
  unknown: {
    // Also reached when a reason *was* given but matches no known cause, so it
    // must not claim that nothing was recorded.
    label: "Cause not identified from the stated reason",
    steps: [
      "Ask the bank for the rejection reason in writing — most will state it on request.",
      "Meanwhile, resolve every high-severity flag in your current assessment; they are the most likely causes.",
      "Re-run the assessment after fixes and only re-apply once the score is out of the high-risk band.",
    ],
    timeline: "2–4 weeks",
  },
};

export function categorizeRejection(reason: string): RejectionCause {
  const text = reason.trim();
  if (!text) return "unknown";
  for (const { cause, pattern } of CAUSE_MATCHERS) {
    if (pattern.test(text)) return cause;
  }
  return "unknown";
}

export function buildRecoveryPlan(
  rejectionReason: string,
  currentFlags: ReadinessFlag[]
): RecoveryPlan {
  const cause = categorizeRejection(rejectionReason);
  const play = PLAYBOOK[cause];

  // The plan must reflect today's file: append the top current high-severity
  // issues that the cause-specific steps don't already cover.
  const extra = currentFlags
    .filter((f) => f.severity === "high")
    .slice(0, 3)
    .map((f) => `Also outstanding today: ${f.issue} — ${f.fix}`);

  return {
    cause,
    causeLabel: play.label,
    steps: [...play.steps, ...extra],
    timeline: play.timeline,
  };
}
