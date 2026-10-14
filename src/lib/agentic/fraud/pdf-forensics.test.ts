import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { describeHistory, parsePdfDate, readPdfHistory, wasAltered } from "./pdf-forensics";

const specimen = (caseId: string, file: string) =>
  readFileSync(path.resolve(__dirname, "../../../../public/specimens", caseId, file));

/** Append a minimal incremental update, as a PDF editor does. */
function reSave(original: Buffer, producer: string, modDate: string): Buffer {
  const text = original.toString("latin1");
  const size = Number(text.match(/\/Size (\d+)/)![1]);
  const root = text.match(/\/Root (\d+ \d+ R)/)![1];
  const prev = Number(text.match(/startxref\s+(\d+)\s+%%EOF\s*$/)![1]);
  const objOffset = original.length + 1;
  const obj = `\n${size} 0 obj\n<</Producer (${producer})/ModDate (${modDate})>>\nendobj\n`;
  const xrefOffset = original.length + Buffer.byteLength(obj, "latin1");
  const tail =
    `xref\n0 1\n0000000000 65535 f \n${size} 1\n${String(objOffset).padStart(10, "0")} 00000 n \n` +
    `trailer\n<</Size ${size + 1} /Root ${root} /Info ${size} 0 R /Prev ${prev}>>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.concat([original, Buffer.from(obj + tail, "latin1")]);
}

describe("PDF forensics", () => {
  it("parses PDF dates with and without a timezone", () => {
    expect(parsePdfDate("D:20261014102333+00'00'")?.toISOString()).toBe("2026-10-14T10:23:33.000Z");
    expect(parsePdfDate("D:20261014143000+04'00'")?.toISOString()).toBe("2026-10-14T10:30:00.000Z");
    expect(parsePdfDate("D:2026")?.getUTCFullYear()).toBe(2026);
    expect(parsePdfDate("garbage")).toBeNull();
  });

  it("finds nothing on a statement saved once", () => {
    const h = readPdfHistory(specimen("qamar-orchard", "bank-statement.pdf"));
    expect(h).toMatchObject({ isPdf: true, revisions: 1, modifiedAfterCreation: false, producers: ["Skia/PDF m155"] });
    expect(wasAltered(h)).toBe(false);
    expect(describeHistory(h)).toMatch(/never re-saved/);
  });

  it("reads an incremental re-save by a different program", () => {
    const edited = reSave(specimen("qamar-orchard", "bank-statement.pdf"), "SpecimenPDF Editor 2.1", "D:20271014180000+00'00'");
    const h = readPdfHistory(edited);
    expect(h.revisions).toBe(2);
    expect(h.producers).toEqual(["Skia/PDF m155", "SpecimenPDF Editor 2.1"]);
    expect(h.modifiedAfterCreation).toBe(true);
    expect(wasAltered(h)).toBe(true);
    expect(describeHistory(h)).toMatch(/saved 2 times.*SpecimenPDF Editor 2\.1/);
  });

  it("does not mistake an image for a PDF", () => {
    const h = readPdfHistory(specimen("bluewater-cargo", "passport-scan.jpg"));
    expect(h.isPdf).toBe(false);
    expect(wasAltered(h)).toBe(false);
  });
});
