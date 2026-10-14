/**
 * PDF file history, read straight from the bytes — no model, no library.
 *
 * A PDF edited after it was issued usually says so. Editors append an
 * *incremental update* rather than rewriting the file: a second body, a second
 * cross-reference table, a second `%%EOF`. They also stamp their own name as
 * Producer and a later ModDate. None of this proves fraud — a digital signature
 * is an incremental update too — but a statement re-saved by a different
 * program after the bank issued it is exactly what a reviewer should know.
 *
 * Pure and deterministic, so its findings are rule judgments: certain facts.
 * What they *mean* is weighed by the Fraud Sentinel with the other signals.
 */

export interface PdfHistory {
  isPdf: boolean;
  /** Number of saved revisions (`%%EOF` markers). 1 = never re-saved. */
  revisions: number;
  /**
   * Every distinct Producer — the program that actually wrote the bytes — in
   * file order. Creator is ignored: it names the *source* application (for a
   * browser-printed PDF, a whole user-agent string), so counting it would make
   * every untouched file look like the work of two programs.
   */
  producers: string[];
  creationDate: Date | null;
  modDate: Date | null;
  /** ModDate more than a minute after CreationDate. */
  modifiedAfterCreation: boolean;
}

/** Parse a PDF date: D:YYYYMMDDHHmmSS+HH'mm' (most parts optional). */
export function parsePdfDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const m = raw.match(/D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([Z+-])?(\d{2})?'?(\d{2})?/);
  if (!m) return null;
  const [, y, mo = "01", d = "01", h = "00", mi = "00", s = "00", sign, oh = "00", om = "00"] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${!sign || sign === "Z" ? "Z" : `${sign}${oh}:${om}`}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

const unescape = (s: string) => s.replace(/\\([()\\])/g, "$1");

export function readPdfHistory(bytes: Uint8Array): PdfHistory {
  // latin1 maps every byte to one char, so offsets and markers survive intact.
  const text = Buffer.from(bytes).toString("latin1");
  const isPdf = text.startsWith("%PDF-");
  const revisions = (text.match(/%%EOF/g) ?? []).length;

  const producers: string[] = [];
  for (const m of text.matchAll(/\/Producer\s*\(((?:\\.|[^\\)])*)\)/g)) {
    const p = unescape(m[1]).trim();
    if (p && !producers.includes(p)) producers.push(p);
  }

  // The last occurrence wins: in an incrementally updated file, the newest
  // Info dictionary comes last.
  const last = (key: string) => {
    const all = [...text.matchAll(new RegExp(`\\/${key}\\s*\\(([^)]*)\\)`, "g"))];
    return all.length ? all[all.length - 1][1] : null;
  };
  const creationDate = parsePdfDate(last("CreationDate"));
  const modDate = parsePdfDate(last("ModDate"));
  const modifiedAfterCreation =
    !!creationDate && !!modDate && modDate.getTime() - creationDate.getTime() > 60_000;

  return { isPdf, revisions, producers, creationDate, modDate, modifiedAfterCreation };
}

/** True when the file shows any sign of being re-saved after it was issued. */
export function wasAltered(h: PdfHistory): boolean {
  return h.isPdf && (h.revisions > 1 || h.modifiedAfterCreation);
}

/** One sentence for the timeline and the reviewer. */
export function describeHistory(h: PdfHistory): string {
  if (!h.isPdf) return "Not a PDF — no file history to read.";
  if (!wasAltered(h)) return `Saved once${h.producers[0] ? ` by ${h.producers[0]}` : ""}; never re-saved.`;
  const parts = [];
  if (h.revisions > 1) parts.push(`saved ${h.revisions} times (incremental update)`);
  if (h.modifiedAfterCreation && h.creationDate && h.modDate) {
    const mins = Math.round((h.modDate.getTime() - h.creationDate.getTime()) / 60_000);
    parts.push(`modified ${mins >= 120 ? `${Math.round(mins / 60)} h` : `${mins} min`} after it was created`);
  }
  if (h.producers.length > 1) parts.push(`by ${h.producers.length} different programs (${h.producers.join(" → ")})`);
  return `Re-saved after issue: ${parts.join("; ")}.`;
}
