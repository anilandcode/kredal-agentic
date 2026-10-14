import { describe, expect, it } from "vitest";
import { calculateReadiness } from "@/lib/scoring/engine";
import { assembleScoringInput } from "../assemble";
import { groundTruthDocuments, SPECIMEN_CASES, specimenCase } from "./index";

/**
 * The specimen cases are designed to exercise specific behaviour. These tests
 * pin that design against the published engine, with a perfect extraction —
 * so if a case drifts, the demo's story is caught breaking here, not live.
 */

const score = (id: string) => {
  const c = specimenCase(id)!;
  return calculateReadiness(assembleScoringInput(c.id, c, groundTruthDocuments(c)));
};

describe("specimen cases", () => {
  it("are all fictional and marked as such", () => {
    expect(SPECIMEN_CASES.length).toBeGreaterThanOrEqual(2);
    for (const c of SPECIMEN_CASES) {
      for (const d of c.documents) {
        if (d.type === "bank_statement") expect(d.truth.bank_name).toBe("SPECIMEN BANK");
      }
    }
  });

  it("Qamar Orchard: a clean file scores high", () => {
    const r = score("qamar-orchard");
    expect(r.flags.map((f) => f.issue)).toEqual([]);
    expect(r.overallScore).toBeGreaterThanOrEqual(90);
  });

  it("Marina Lantern: the file scores strong — the altered statement is invisible to the score", () => {
    // The point of this case: a forged balance does not lower a readiness
    // score. Only the Fraud Sentinel can catch it.
    const r = score("marina-lantern");
    expect(r.flags.map((f) => f.issue)).toEqual([]);
    expect(r.overallScore).toBeGreaterThanOrEqual(90);
    const st = specimenCase("marina-lantern")!.documents.find((d) => d.type === "bank_statement")!;
    const t = st.truth;
    const sum = Number(t.opening_balance) + Number(t.total_credits) - Number(t.total_debits);
    expect(Math.abs(sum - Number(t.closing_balance))).toBeGreaterThan(999_999); // printed figure is off by AED 1m
  });

  it("Bluewater Cargo: the licence contradicts the profile and the passport has expired", () => {
    const r = score("bluewater-cargo");
    const issues = r.flags.map((f) => f.issue).join(" | ");
    expect(issues).toMatch(/Trade license reads "Crescent Bay Freight Services FZE"/);
    expect(issues).toMatch(/passport has expired/);
    expect(r.overallScore).toBeLessThan(50);
  });
});
