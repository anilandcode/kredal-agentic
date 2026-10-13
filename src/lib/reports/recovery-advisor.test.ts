import { describe, expect, it } from "vitest";
import {
  buildRecoveryPlan,
  categorizeRejection,
} from "@/lib/reports/recovery-advisor";
import type { ReadinessFlag } from "@/lib/types";

describe("categorizeRejection", () => {
  it("maps source-of-funds phrasings", () => {
    expect(categorizeRejection("Unable to verify source of funds")).toBe("source_of_funds");
    expect(categorizeRejection("unexplained deposits")).toBe("source_of_funds");
  });

  it("maps ownership phrasings", () => {
    expect(categorizeRejection("UBO structure unclear")).toBe("ubo_ownership");
    expect(categorizeRejection("shareholding documents required")).toBe("ubo_ownership");
  });

  it("maps balance phrasings", () => {
    expect(categorizeRejection("does not meet minimum balance requirement")).toBe("minimum_balance");
  });

  it("maps activity phrasings", () => {
    expect(categorizeRejection("business activity outside licence scope")).toBe("activity_mismatch");
  });

  it("maps document phrasings", () => {
    expect(categorizeRejection("incomplete paperwork / expired tenancy")).toBe("documents");
  });

  it("falls back to unknown for empty or unmatched text", () => {
    expect(categorizeRejection("")).toBe("unknown");
    expect(categorizeRejection("no reason given by branch staff")).toBe("unknown");
  });
});

describe("buildRecoveryPlan", () => {
  const flags: ReadinessFlag[] = [
    { severity: "high", category: "document_completeness", issue: "Trade license not uploaded.", fix: "Upload it." },
    { severity: "medium", category: "bank_fit", issue: "No target bank.", fix: "Pick one." },
  ];

  it("returns cause-specific steps plus current high flags", () => {
    const plan = buildRecoveryPlan("source of funds not proven", flags);
    expect(plan.cause).toBe("source_of_funds");
    expect(plan.steps.join(" ")).toMatch(/narrative/i);
    expect(plan.steps.join(" ")).toMatch(/Trade license not uploaded/);
    expect(plan.steps.join(" ")).not.toMatch(/No target bank/);
    expect(plan.timeline).toBeTruthy();
  });

  it("handles the unknown cause with a written-reason step", () => {
    const plan = buildRecoveryPlan("", []);
    expect(plan.cause).toBe("unknown");
    expect(plan.steps.join(" ")).toMatch(/in writing/i);
  });
});
