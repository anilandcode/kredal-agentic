import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RunLog } from "../events";
import { AE } from "../jurisdictions/ae";
import { specimenCase } from "../specimens";
import { classify, type DocFile } from "./intake";
import { extract } from "./extractor";

/**
 * Live tests against Vertex AI. Off by default — they cost money and need
 * Application Default Credentials. Run with:
 *
 *   KREDAL_VERTEX_TESTS=1 GOOGLE_CLOUD_PROJECT=fiery-protocol-506516-b0 npx vitest run vertex
 */
const live = process.env.KREDAL_VERTEX_TESTS === "1";

function load(caseId: string, docId: string): { file: DocFile; truth: Record<string, string>; type: string } {
  const c = specimenCase(caseId)!;
  const d = c.documents.find((x) => x.id === docId)!;
  const p = path.resolve(__dirname, "../../../../public/specimens", caseId, d.file);
  return {
    file: {
      id: d.id,
      name: d.file,
      mimeType: d.file.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
      base64: readFileSync(p).toString("base64"),
    },
    truth: d.truth,
    type: d.type,
  };
}

const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().replace(/[\s,]+/g, " ").replace(/\.00$/, "").trim();

describe.skipIf(!live)("agents on Vertex", () => {
  it("Intake classifies a trade licence and spots the specimen mark", async () => {
    const log = new RunLog();
    const { file } = load("qamar-orchard", "licence");
    const r = await classify(file, AE, log);
    console.log("intake:", r);
    expect(r?.doc_type).toBe("trade_license");
    expect(r?.is_specimen).toBe(true);
  }, 90_000);

  for (const [caseId, docId] of [
    ["qamar-orchard", "licence"],
    ["qamar-orchard", "statement"],
    ["bluewater-cargo", "passport"],
  ] as const) {
    it(`Extractor reads ${caseId}/${docId} against ground truth`, async () => {
      const log = new RunLog();
      const { file, truth, type } = load(caseId, docId);
      const spec = AE.docTypes.find((d) => d.id === type)!;
      const r = await extract(file, spec, log);
      const rows = Object.entries(truth).map(([k, want]) => {
        const got = r.fields[k];
        return { field: k, want, got: got?.value ?? null, conf: got?.confidence, ok: norm(got?.value) === norm(want) };
      });
      console.table(rows);
      console.log(`model=${r.model} attempts=${r.attempts} healed=${r.healed}`, log.events.filter((e) => e.kind === "heal").map((e) => e.message));
      const accuracy = rows.filter((x) => x.ok).length / rows.length;
      expect(accuracy).toBeGreaterThanOrEqual(0.8);
    }, 180_000);
  }
});
