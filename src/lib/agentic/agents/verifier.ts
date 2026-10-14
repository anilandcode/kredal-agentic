import "server-only";
import { z } from "zod";
import { namesRoughlyMatch } from "@/lib/scoring/rules";
import type { CaseProfile } from "../assemble";
import type { EvidenceRef, Judgment } from "../decision";
import type { RunLog } from "../events";
import type { Extraction } from "./extractor";
import { runTypedAgent } from "./run-agent";

/**
 * Verifier: do the documents agree with each other and with the profile?
 *
 * Deterministic first. Two names identical after normalising case, word order
 * and legal suffixes are a rule judgment — certain, no model involved. Only
 * when they differ does Gemini judge whether they are the same person or
 * company (transliteration, initials, trading vs legal name), and its
 * probability is calibrated before anything acts on it.
 *
 * It also turns each critical field the Extractor read into a judgment, so a
 * shaky read of an expiry date makes the expiry rule's outcome uncertain too.
 */

export type Calibrate = (model: string | null, kind: string, raw: number) => number;

const LEGAL = /\b(llc|l\.l\.c|fzc|fze|fz-llc|fz llc|ltd|limited|est|establishment|pjsc|plc)\b/g;
const canonical = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(LEGAL, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");

const NameMatch = z.object({
  match: z.boolean().describe("True if both names refer to the same person or company"),
  probability: z.number().min(0).max(1).describe("Probability that `match` is correct"),
  rationale: z.string().describe("One sentence a compliance officer would accept"),
});

interface NameCheck {
  id: string;
  question: string;
  a: string | null | undefined;
  b: string | null | undefined;
  context: string;
  ruleIds: string[];
  evidence: EvidenceRef[];
}

async function judgeNames(check: NameCheck, log: RunLog, calibrate: Calibrate): Promise<Judgment<boolean> | null> {
  if (!check.a || !check.b) return null;
  const base = {
    id: check.id,
    question: check.question,
    severity: "standard" as const,
    evidence: check.evidence,
    ruleIds: check.ruleIds,
  };

  if (canonical(check.a) === canonical(check.b)) {
    return {
      ...base,
      verdict: true,
      probability: 1,
      source: "rule",
      rationale: "Identical once case, word order and legal suffixes are normalised.",
    };
  }

  const answer = await runTypedAgent({
    name: "verifier",
    tier: "fast",
    log,
    schema: NameMatch,
    instruction:
      "You are the Verifier agent. Decide whether two names, read from different documents, " +
      "refer to the same person or company. Account for transliteration (Mohammed/Muhammad), " +
      "word order, initials and legal-form suffixes — but a different trading or legal name is " +
      "NOT a match, because a bank will treat it as a different entity.",
    parts: [{ text: `${check.context}\nA: "${check.a}"\nB: "${check.b}"` }],
  });

  if (!answer.ok) {
    // No usable model answer: fall back to the deterministic heuristic, and
    // mark it uncertain so a person confirms it.
    return {
      ...base,
      verdict: namesRoughlyMatch(check.a, check.b),
      probability: 0.5,
      source: "model",
      model: answer.model ?? undefined,
      rationale: "The model's answer was unusable; deterministic comparison only.",
    };
  }

  const raw = answer.value.probability;
  return {
    ...base,
    verdict: answer.value.match,
    probability: calibrate(answer.model, "name_match", raw),
    rawProbability: raw,
    source: "model",
    model: answer.model ?? undefined,
    rationale: answer.value.rationale,
  };
}

/** Critical fields → the published rules whose outcome depends on reading them right. */
const FIELD_RULES: Record<string, Record<string, string[]>> = {
  trade_license: {
    legal_name: ["xdoc_license_name_mismatch"],
    expiry_date: ["xdoc_license_expired"],
  },
  owner_passport: {
    full_name: ["xdoc_passport_name_mismatch"],
    expiry_date: ["xdoc_passport_expired"],
  },
};

export async function verify(
  profile: CaseProfile,
  extractions: Extraction[],
  log: RunLog,
  calibrate: Calibrate
): Promise<Judgment<boolean>[]> {
  log.emit("verifier", "stage", "Cross-checking documents against each other and the profile.");
  const by = (type: string) => extractions.find((e) => e.docType === type);
  const licence = by("trade_license");
  const passport = by("owner_passport");
  const statement = by("bank_statement");
  const judgments: Judgment<boolean>[] = [];

  // 1. Every critical field read becomes a judgment.
  for (const e of extractions) {
    const rules = FIELD_RULES[e.docType];
    if (!rules) continue;
    for (const [field, ruleIds] of Object.entries(rules)) {
      const r = e.fields[field];
      if (!r || r.value === null) continue;
      judgments.push({
        id: `read.${e.docType}.${field}`,
        question: `Does the ${e.docType.replace(/_/g, " ")} show ${field.replace(/_/g, " ")} as "${r.value}"?`,
        verdict: true,
        probability: calibrate(e.model, "field_read", r.confidence),
        rawProbability: r.confidence,
        severity: "standard",
        evidence: [{ docId: e.docType, docType: e.docType, field, quote: r.quote ?? r.value }],
        ruleIds,
        source: "model",
        model: e.model ?? undefined,
      });
    }
  }

  // 2. Names across documents, in parallel.
  const owner = profile.owners[0]?.full_name;
  const checks: NameCheck[] = [
    {
      id: "identity.company_name.licence_vs_profile",
      question: `Is "${licence?.fields.legal_name?.value}" on the licence the same company as "${profile.company.legal_name}" in the profile?`,
      a: licence?.fields.legal_name?.value,
      b: profile.company.legal_name,
      context: "A = company name on the trade licence. B = company name in the application profile.",
      ruleIds: ["xdoc_license_name_mismatch"],
      evidence: [{ docId: "trade_license", docType: "trade_license", field: "legal_name", quote: licence?.fields.legal_name?.quote ?? undefined }],
    },
    {
      id: "identity.owner_name.passport_vs_profile",
      question: `Is the passport holder "${passport?.fields.full_name?.value}" the listed owner "${owner}"?`,
      a: passport?.fields.full_name?.value,
      b: owner,
      context: "A = holder name on the passport (surname may come first). B = owner name in the profile.",
      ruleIds: ["xdoc_passport_name_mismatch"],
      evidence: [{ docId: "owner_passport", docType: "owner_passport", field: "full_name", quote: passport?.fields.full_name?.quote ?? undefined }],
    },
    {
      id: "account.holder_vs_company",
      question: `Is the bank statement held by the company itself, rather than a person?`,
      a: statement?.fields.account_holder?.value,
      b: profile.company.legal_name,
      context:
        "A = account holder on the bank statement. B = the applicant company. A statement in a " +
        "person's name is NOT a match: it is a personal account.",
      ruleIds: [],
      evidence: [{ docId: "bank_statement", docType: "bank_statement", field: "account_holder", quote: statement?.fields.account_holder?.quote ?? undefined }],
    },
  ];
  const names = await Promise.all(checks.map((c) => judgeNames(c, log, calibrate)));
  for (const j of names) if (j) judgments.push(j);

  for (const j of judgments) {
    log.emit("verifier", "judgment", j.question, {
      id: j.id,
      verdict: j.verdict,
      probability: j.probability,
      rawProbability: j.rawProbability,
      source: j.source,
      model: j.model,
      rationale: j.rationale,
    });
  }
  log.emit("verifier", "stage", `${judgments.length} judgments produced.`);
  return judgments;
}
