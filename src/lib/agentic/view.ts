/**
 * Plain shapes the browser renders. No server imports: shared by the live
 * console (client) and the stored-run replay (server).
 */

import type { RunEvent } from "./events";

export type { RunEvent };

export interface DecisionView {
  id: string;
  question: string;
  action: "act" | "review";
  reason: string;
  verdict: boolean;
  probability: number;
  rawProbability: number | null;
  severity: "info" | "standard" | "critical";
  source: "rule" | "model" | "human";
  model: string | null;
  rationale: string | null;
  ruleIds: string[];
}

export interface FieldView {
  value: string | null;
  confidence: number;
  quote: string | null;
}

export interface RunSummaryView {
  range: { expected: number; low: number; high: number; pending: string[] };
  risk: "low" | "medium" | "high";
  categoryScores: Record<string, { score: number; max: number; label: string; detail: string }>;
  flags: { severity: string; category: string; issue: string; fix: string }[];
  disagreements: string[];
  decisions: DecisionView[];
  questions: string[];
  nextActions: string[];
  recovery: { cause: string; causeLabel: string; steps: string[]; timeline: string } | null;
  packMarkdown: string;
  accuracy: {
    correct: number;
    total: number;
    misses: { file: string; field: string; want: string; got: string | null; confidence: number | null }[];
  } | null;
  intake: { file: string; doc_type: string; confidence: number; legibility: string; model: string | null }[];
  extractions: {
    file: string;
    docType: string;
    model: string | null;
    attempts: number;
    healed: boolean;
    unresolved: string | null;
    fields: Record<string, FieldView>;
  }[];
}

export interface StoredRun {
  id: string;
  caseId: string;
  caseTitle: string;
  status: "running" | "done" | "failed";
  chaos: boolean;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number | null;
  heals?: number;
  error?: string;
  result?: RunSummaryView;
  events: RunEvent[];
}

export const AGENT_LABEL: Record<RunEvent["agent"], string> = {
  orchestrator: "Orchestrator",
  intake: "Intake",
  extractor: "Extractor",
  verifier: "Verifier",
  fraud: "Fraud Sentinel",
  judge: "Judge",
  advisor: "Advisor",
  healer: "Healer",
  learner: "Learner",
};
