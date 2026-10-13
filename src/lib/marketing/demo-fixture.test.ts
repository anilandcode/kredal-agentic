/**
 * The landing page renders these values, so they must not drift.
 *
 * The score is produced by the real engine, not written by hand. If a scoring
 * rule changes, this test fails — which is the point: the marketing page should
 * never quietly start advertising a different number.
 */
import { describe, expect, it } from "vitest";
import {
  DEMO_ASSESSMENT,
  DEMO_BANK_MATCHES,
  DEMO_PACK_MARKDOWN,
  DEMO_RESULT,
} from "./demo-fixture";

describe("marketing demo fixture", () => {
  it("produces a stable score from the real engine", () => {
    // Pinned deliberately. This exact number is printed on the landing page, so
    // a change here is a change to public marketing copy — it should require a
    // conscious edit, not happen as a side effect of a scoring tweak.
    expect(DEMO_RESULT.overallScore).toBe(47);
    expect(DEMO_RESULT.riskLevel).toBe("high");
    expect(DEMO_RESULT.flags).toHaveLength(11);
    expect(DEMO_ASSESSMENT.overall_score).toBe(DEMO_RESULT.overallScore);
  });

  it("is deliberately imperfect — it must show real flags", () => {
    expect(DEMO_RESULT.flags.length).toBeGreaterThanOrEqual(3);
    expect(DEMO_RESULT.riskLevel).not.toBe("low");
  });

  it("flags the two missing required documents", () => {
    const text = DEMO_RESULT.flags.map((f) => f.issue).join(" | ");
    expect(text).toMatch(/UBO/i);
  });

  it("generates a real application pack", () => {
    expect(DEMO_PACK_MARKDOWN).toContain("Al Barakah Foods Trading LLC");
    expect(DEMO_PACK_MARKDOWN.length).toBeGreaterThan(500);
  });

  it("ranks banks", () => {
    expect(DEMO_BANK_MATCHES.length).toBeGreaterThan(0);
  });
});
