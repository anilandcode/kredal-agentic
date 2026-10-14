import { describe, expect, it } from "vitest";
import { calculateReadiness } from "@/lib/scoring/engine";
import { DEMO_INPUT } from "@/lib/marketing/demo-fixture";
import { readinessWithUncertainty } from "./readiness";

describe("readinessWithUncertainty", () => {
  it("leaves the published engine untouched: the demo company still scores 47", () => {
    expect(calculateReadiness(DEMO_INPUT).overallScore).toBe(47);
  });

  it("collapses to one number when nothing is pending", () => {
    const r = readinessWithUncertainty(DEMO_INPUT, []);
    expect(r).toMatchObject({ expected: 47, low: 47, high: 47, pending: [] });
  });

  it("reports a range while a deduction awaits a human", () => {
    // The demo file is missing its UBO declaration (−6). Treat that as unknown.
    const r = readinessWithUncertainty(DEMO_INPUT, [
      { ruleId: "doc_ubo_declaration_missing", pFires: 0.5 },
    ]);
    expect(r.low).toBe(47);
    expect(r.high).toBe(53);
    expect(r.expected).toBe(50);
    expect(r.pending).toEqual(["doc_ubo_declaration_missing"]);
  });

  it("leans toward the likelier outcome", () => {
    const likelyFires = readinessWithUncertainty(DEMO_INPUT, [
      { ruleId: "doc_ubo_declaration_missing", pFires: 0.9 },
    ]);
    const likelyClear = readinessWithUncertainty(DEMO_INPUT, [
      { ruleId: "doc_ubo_declaration_missing", pFires: 0.1 },
    ]);
    expect(likelyFires.expected).toBeLessThan(likelyClear.expected);
    expect(likelyFires.expected).toBeGreaterThanOrEqual(likelyFires.low);
    expect(likelyClear.expected).toBeLessThanOrEqual(likelyClear.high);
  });
});
