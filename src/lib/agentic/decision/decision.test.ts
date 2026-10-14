import { describe, expect, it } from "vitest";
import { Calibrator } from "./calibration";
import { decide, ACT_THRESHOLD } from "./policy";
import { noisyOr, poolLogOdds, scoreWithUncertainty } from "./aggregate";
import type { Decision, Judgment } from "./types";

const judgment = (over: Partial<Judgment<boolean>> = {}): Judgment<boolean> => ({
  id: "identity.name_match",
  question: "Does the passport name match the licence owner?",
  verdict: true,
  probability: 0.9,
  severity: "standard",
  evidence: [],
  ruleIds: ["R-ID-01"],
  source: "model",
  model: "gemini-3.8-flash",
  ...over,
});

describe("Calibrator", () => {
  it("returns the raw confidence when there is no history — edges included", () => {
    const c = new Calibrator();
    expect(c.calibrate(0.35)).toBeCloseTo(0.35, 6);
    expect(c.calibrate(0.3)).toBeCloseTo(0.3, 6);
    expect(c.calibrate(0.72)).toBeCloseTo(0.72, 6);
    expect(c.calibrate(0.99)).toBeCloseTo(0.99, 6);
    expect(c.calibrate(0.02)).toBeCloseTo(0.02, 6);
  });

  it("never rates a well-earned 99% claim above what the record shows", () => {
    const c = new Calibrator();
    for (let i = 0; i < 54; i++) c.observe(0.99, true);
    const p = c.calibrate(0.99);
    expect(p).toBeLessThan(1);
    expect(p).toBeGreaterThan(0.98);
  });

  it("does not let evidence about one confidence level move trust at another", () => {
    const c = new Calibrator();
    c.observe(0.55, false); // one wrong answer at a 55% claim
    expect(c.calibrate(0.55)).toBeLessThan(0.55);
    expect(c.calibrate(0.99)).toBeCloseTo(0.99, 6);
  });

  it("learns that an overconfident model must not be taken at its word", () => {
    const c = new Calibrator();
    // The model said 92% forty times; a human found it right 28 times.
    for (let i = 0; i < 40; i++) c.observe(0.92, i < 28);
    const p = c.calibrate(0.92);
    expect(p).toBeLessThan(0.8);
    expect(p).toBeGreaterThan(0.65);
  });

  it("never maps a higher raw confidence to a lower calibrated one", () => {
    const c = new Calibrator();
    // Deliberately noisy, inverted early history.
    for (let i = 0; i < 12; i++) c.observe(0.62, true);
    for (let i = 0; i < 12; i++) c.observe(0.88, i < 3);
    const curve = c.curve();
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1] - 1e-12);
    }
    expect(c.calibrate(0.9)).toBeGreaterThanOrEqual(c.calibrate(0.6) - 1e-12);
  });

  it("reports a large calibration error for an overconfident model and ~0 for an honest one", () => {
    const over = new Calibrator();
    for (let i = 0; i < 50; i++) over.observe(0.95, i < 25);
    expect(over.expectedCalibrationError()).toBeGreaterThan(0.4);

    const honest = new Calibrator();
    for (let i = 0; i < 100; i++) honest.observe(0.7, i < 70);
    expect(honest.expectedCalibrationError()).toBeLessThan(0.01);
  });

  it("survives a round trip through storage", () => {
    const c = new Calibrator();
    for (let i = 0; i < 20; i++) c.observe(0.81, i % 3 !== 0);
    const restored = new Calibrator(JSON.parse(JSON.stringify(c.toJSON())));
    expect(restored.calibrate(0.81)).toBeCloseTo(c.calibrate(0.81), 12);
    expect(restored.observations).toBe(20);
  });
});

describe("decide", () => {
  it("always acts on rules and on people", () => {
    expect(decide(judgment({ source: "rule", probability: 1 })).action).toBe("act");
    expect(decide(judgment({ source: "human", probability: 1 })).action).toBe("act");
  });

  it("acts when a model clears the bar for its severity", () => {
    expect(decide(judgment({ probability: 0.9 })).action).toBe("act");
  });

  it("sends anything below the bar to a person, with the exact question", () => {
    const d = decide(judgment({ probability: 0.8 }));
    expect(d.action).toBe("review");
    expect(d.reviewQuestion).toBe("Does the passport name match the licence owner?");
  });

  it("holds critical checks to a higher bar", () => {
    const d = decide(judgment({ probability: 0.95, severity: "critical" }));
    expect(d.action).toBe("review");
    expect(ACT_THRESHOLD.critical).toBeGreaterThan(0.95);
  });

  it("says so when calibration, not the model, is what blocked it", () => {
    const d = decide(judgment({ probability: 0.74, rawProbability: 0.93 }));
    expect(d.action).toBe("review");
    expect(d.reason).toMatch(/claimed 93%/);
    expect(d.reason).toMatch(/right 74% of the time/);
  });
});

describe("aggregation", () => {
  it("pools agreeing estimates without inventing certainty", () => {
    expect(poolLogOdds([0.8, 0.8])).toBeCloseTo(0.8, 6);
    expect(poolLogOdds([0.9, 0.1])).toBeCloseTo(0.5, 6);
  });

  it("combines independent risks", () => {
    expect(noisyOr([0.5, 0.5])).toBeCloseTo(0.75, 6);
    expect(noisyOr([])).toBe(0);
  });

  it("scores a file as a range until its pending checks are answered", () => {
    const act = (verdict: boolean): Decision => ({
      judgment: judgment({ verdict, probability: 1, source: "rule" }),
      action: "act",
      reason: "",
    });
    const pending: Decision = {
      judgment: judgment({ verdict: true, probability: 0.6 }),
      action: "review",
      reason: "",
    };
    const s = scoreWithUncertainty([
      { ruleId: "A", points: 10, decision: act(true) },
      { ruleId: "B", points: 5, decision: act(false) },
      { ruleId: "C", points: 15, decision: pending },
    ]);
    expect(s).toEqual({ expected: 19, low: 10, high: 25, pending: ["C"] });
  });
});
