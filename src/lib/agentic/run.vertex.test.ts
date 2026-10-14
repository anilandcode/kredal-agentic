import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RunLog } from "./events";
import { AE } from "./jurisdictions/ae";
import { runCase } from "./run";
import { specimenCase } from "./specimens";

/** End-to-end agent runs on Vertex. Opt-in: KREDAL_VERTEX_TESTS=1. */
const live = process.env.KREDAL_VERTEX_TESTS === "1";
const identity = (_m: string | null, _k: string, raw: number) => raw;

function inputFor(caseId: string, chaos = false) {
  const c = specimenCase(caseId)!;
  const dir = path.resolve(__dirname, "../../../public/specimens", caseId);
  return {
    caseId,
    profile: c,
    pack: AE,
    chaos,
    truth: Object.fromEntries(c.documents.map((d) => [d.file, d.truth])),
    files: c.documents.map((d) => ({
      id: d.id,
      name: d.file,
      mimeType: d.file.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
      base64: readFileSync(path.join(dir, d.file)).toString("base64"),
    })),
  };
}

const summarise = (log: RunLog) =>
  log.events
    .filter((e) => ["heal", "result", "warning", "error"].includes(e.kind) || (e.kind === "decision" && e.data?.action === "review"))
    .map((e) => `${String(e.t).padStart(6)}ms ${e.agent.padEnd(9)} ${e.kind.padEnd(8)} ${e.message}`);

describe.skipIf(!live)("agent team end to end", () => {
  it("Qamar Orchard: clean file, every check settled", async () => {
    const log = new RunLog();
    const out = await runCase(inputFor("qamar-orchard"), log, identity);
    console.log(summarise(log).join("\n"));
    console.log("accuracy", out.accuracy, "range", out.verdicts.range);
    expect(out.verdicts.range.pending).toEqual([]);
    expect(out.verdicts.range.low).toBeGreaterThanOrEqual(85);
  }, 300_000);

  it("Bluewater Cargo with an injected failure: heals, flags, asks", async () => {
    const log = new RunLog();
    const out = await runCase(inputFor("bluewater-cargo", true), log, identity);
    console.log(summarise(log).join("\n"));
    console.log("accuracy", out.accuracy, "range", out.verdicts.range, "questions", out.verdicts.questions.map((q) => q.judgment.question));
    expect(log.events.some((e) => e.kind === "heal" && e.data?.strategy === "model_failover")).toBe(true);
    expect(out.verdicts.range.asExtracted.flags.map((f) => f.issue).join(" ")).toMatch(/Crescent Bay/);
    expect(out.verdicts.range.high).toBeLessThan(60);
  }, 300_000);
});
