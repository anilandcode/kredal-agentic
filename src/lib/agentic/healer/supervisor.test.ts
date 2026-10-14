import { describe, expect, it } from "vitest";
import { RunLog } from "../events";
import { repairFor, supervise, type Attempt, type Problem } from "./supervisor";

const base: Attempt = { number: 1, tier: "fast" };

describe("repairFor", () => {
  it("retries a schema failure on the same tier, quoting the error", () => {
    const r = repairFor({ kind: "schema_invalid", detail: "expiry_date: expected string" }, base);
    expect(r.tier).toBe("fast");
    expect(r.repairHint).toMatch(/expiry_date: expected string/);
  });

  it("escalates low confidence and contradictions to the strong tier", () => {
    expect(repairFor({ kind: "low_confidence", detail: "0.41" }, base).tier).toBe("strong");
    const c = repairFor({ kind: "contradiction", detail: "x", fields: ["full_name"] }, base);
    expect(c.tier).toBe("strong");
    expect(c.repairHint).toMatch(/full_name/);
  });
});

describe("supervise", () => {
  it("returns the first good answer without healing", async () => {
    const log = new RunLog();
    const r = await supervise({
      agent: "extractor",
      label: "trade licence",
      log,
      run: async () => ({ confidence: 0.95 }),
      check: () => null,
    });
    expect(r).toMatchObject({ ok: true, attempts: 1, healed: false });
    expect(log.events.filter((e) => e.kind === "heal")).toHaveLength(0);
  });

  it("repairs a low-confidence reading by escalating, and says so", async () => {
    const log = new RunLog();
    const tiers: string[] = [];
    const r = await supervise({
      agent: "extractor",
      label: "passport",
      log,
      run: async (a) => {
        tiers.push(a.tier);
        return { confidence: a.tier === "strong" ? 0.93 : 0.4 };
      },
      check: (v): Problem | null =>
        v.confidence < 0.7 ? { kind: "low_confidence", detail: `confidence ${v.confidence}` } : null,
    });
    expect(r).toMatchObject({ ok: true, attempts: 2, healed: true });
    expect(tiers).toEqual(["fast", "strong"]);
    const heals = log.events.filter((e) => e.kind === "heal");
    expect(heals.map((e) => e.data?.strategy)).toEqual(["low_confidence", "verified"]);
  });

  it("treats a thrown error as a model failure and retries", async () => {
    const log = new RunLog();
    let calls = 0;
    const r = await supervise({
      agent: "intake",
      label: "classify",
      log,
      run: async () => {
        if (++calls === 1) throw new Error("503 unavailable");
        return "ok";
      },
      check: () => null,
    });
    expect(r).toMatchObject({ ok: true, attempts: 2 });
  });

  it("gives up honestly instead of guessing", async () => {
    const log = new RunLog();
    const r = await supervise({
      agent: "extractor",
      label: "statement",
      log,
      maxAttempts: 2,
      run: async () => ({ confidence: 0.3 }),
      check: () => ({ kind: "low_confidence", detail: "too blurry" }),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.problem.kind).toBe("low_confidence");
      expect(r.lastValue).toEqual({ confidence: 0.3 });
    }
    expect(log.events.at(-1)?.message).toMatch(/a person will be asked/);
  });
});
