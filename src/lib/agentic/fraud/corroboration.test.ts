import { describe, expect, it } from "vitest";
import { ACT_THRESHOLD, noisyOr } from "../decision";
import { corroboratedDoubt } from "./corroboration";

/** P(unaltered) as the integrity gate computes it, from the remaining weights. */
const pUnaltered = (weights: number[]) => 1 - noisyOr(weights);

describe("corroborated doubt", () => {
  it("leaves the model's doubt alone when no deterministic check passed", () => {
    expect(corroboratedDoubt(0.05, 0)).toBeCloseTo(0.05, 10);
  });

  it("halves the doubt for each independent check that passed", () => {
    expect(corroboratedDoubt(0.05, 1)).toBeCloseTo(0.025, 10);
    expect(corroboratedDoubt(0.05, 2)).toBeCloseTo(0.0125, 10);
  });

  it("clears a clean statement the model rated 95% unedited (the live false alarm)", () => {
    // Before: 95% < the 97% critical bar → a person was asked about a clean file.
    expect(pUnaltered([0.05])).toBeLessThan(ACT_THRESHOLD.critical);
    // After: file history clean + totals reconcile corroborate the model.
    expect(pUnaltered([corroboratedDoubt(0.05, 2)])).toBeGreaterThanOrEqual(ACT_THRESHOLD.critical);
  });

  it("still asks when the model is genuinely unsure, even with clean checks", () => {
    expect(pUnaltered([corroboratedDoubt(0.2, 2)])).toBeLessThan(ACT_THRESHOLD.critical);
  });
});
