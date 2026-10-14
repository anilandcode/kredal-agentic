import { describe, expect, it } from "vitest";
import { assembleScoringInput } from "../assemble";
import type { Judgment } from "../decision";
import { groundTruthDocuments, specimenCase } from "../specimens";
import { judge } from "./judge";

const bluewater = () => {
  const c = specimenCase("bluewater-cargo")!;
  return assembleScoringInput(c.id, c, groundTruthDocuments(c));
};

const nameCheck = (over: Partial<Judgment<boolean>>): Judgment<boolean> => ({
  id: "identity.company_name.licence_vs_profile",
  question: "Same company?",
  verdict: false,
  probability: 0.96,
  severity: "standard",
  evidence: [],
  ruleIds: ["xdoc_license_name_mismatch"],
  source: "model",
  model: "gemini-3.8-flash",
  ...over,
});

describe("judge", () => {
  it("settles a rule when a confident model agrees with it", () => {
    // The licence really does name a different company; the model agrees.
    const v = judge(bluewater(), [nameCheck({})]);
    expect(v.range.pending).toEqual([]);
    expect(v.disagreements).toEqual([]);
    expect(v.range.low).toBe(v.range.high);
  });

  it("asks a person when a confident model contradicts the rule", () => {
    const v = judge(bluewater(), [nameCheck({ verdict: true, probability: 0.97 })]);
    expect(v.disagreements).toEqual(["xdoc_license_name_mismatch"]);
    expect(v.range.pending).toEqual(["xdoc_license_name_mismatch"]);
    expect(v.questions.map((q) => q.judgment.id)).toContain("identity.company_name.licence_vs_profile");
    expect(v.range.high - v.range.low).toBe(6); // the rule's points
  });

  it("turns an uncertain field read into a range on the rule it feeds", () => {
    const read: Judgment<boolean> = {
      id: "read.owner_passport.expiry_date",
      question: 'Does the passport show expiry date as "2026-08-02"?',
      verdict: true,
      probability: 0.6,
      severity: "standard",
      evidence: [],
      ruleIds: ["xdoc_passport_expired"],
      source: "model",
    };
    const v = judge(bluewater(), [read]);
    expect(v.range.pending).toEqual(["xdoc_passport_expired"]);
    expect(v.questions[0].judgment.id).toBe("read.owner_passport.expiry_date");
    // Read as expired with 60% belief → the deduction is more likely than not.
    expect(v.range.expected).toBeLessThan((v.range.low + v.range.high) / 2);
  });
});
