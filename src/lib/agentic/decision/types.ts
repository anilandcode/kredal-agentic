/**
 * The decision engine's vocabulary.
 *
 * Every decision Kredal makes is a typed judgment — a question, a verdict, and a
 * probability that the verdict is right — never free text. That is what lets
 * the rest of the system route on uncertainty, show its working, and learn how
 * far to trust each model.
 */

/** A verdict is always a plain value the code can branch on. */
export type Verdict = boolean | string | number;

/** Where a judgment came from. Rules and humans are certain; models are not. */
export type JudgmentSource = "rule" | "model" | "human";

/**
 * How much a wrong call costs. It sets how sure the engine must be before it
 * acts without a human: a missed sanctions hit is not a typo in an address.
 */
export type Severity = "info" | "standard" | "critical";

/** A pointer into a document, so every judgment can show its evidence. */
export interface EvidenceRef {
  docId: string;
  docType: string;
  field?: string;
  /** The value exactly as read, so a reviewer can check it against the page. */
  quote?: string;
  page?: number;
}

export interface Judgment<V extends Verdict = Verdict> {
  /** Stable key, e.g. `identity.name_match.passport_vs_licence`. */
  id: string;
  question: string;
  verdict: V;
  /**
   * Probability that `verdict` is correct, 0..1. For a model this is the
   * *calibrated* value — see `calibration.ts` — not the model's raw claim.
   */
  probability: number;
  /** The model's own claim before calibration, kept for the audit trail. */
  rawProbability?: number;
  severity: Severity;
  evidence: EvidenceRef[];
  /** Deterministic scoring rules this judgment feeds. */
  ruleIds: string[];
  source: JudgmentSource;
  /** Which model produced it, when `source` is "model". */
  model?: string;
  rationale?: string;
}

/** What the engine does with a judgment. */
export type Action = "act" | "review";

export interface Decision<V extends Verdict = Verdict> {
  judgment: Judgment<V>;
  action: Action;
  /** Plain-language reason for the routing, shown in the UI and the log. */
  reason: string;
  /** For `review`: the one precise question a human must answer. */
  reviewQuestion?: string;
}
