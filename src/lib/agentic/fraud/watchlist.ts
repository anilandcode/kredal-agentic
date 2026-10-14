/**
 * Screening against a watchlist — the deterministic first pass.
 *
 * DEMONSTRATION DATA. Every entry below is fictional and labelled as such
 * wherever it is shown. This is not a sanctions or PEP screen; a production
 * deployment screens against the official consolidated lists. The point here
 * is the *decision*: a name that resembles a listed one is not a match until
 * someone weighs date of birth and nationality, and on a critical check the
 * engine asks a person rather than guess either way.
 */

export interface WatchlistEntry {
  id: string;
  name: string;
  aliases: string[];
  dateOfBirth: string | null;
  nationality: string | null;
  listing: string;
}

export const WATCHLIST_NOTICE =
  "Demonstration watchlist of fictional entries — not a sanctions or PEP screen. Production screens against official consolidated lists.";

export const DEMO_WATCHLIST: WatchlistEntry[] = [
  { id: "DEMO-WL-0102", name: "Corvin Halvard Østby", aliases: ["C. H. Ostby"], dateOfBirth: "1964-02-19", nationality: "Fictional", listing: "Demonstration entry" },
  { id: "DEMO-WL-0147", name: "Velmora Holdings Trading House", aliases: ["Velmora Trading"], dateOfBirth: null, nationality: "Fictional", listing: "Demonstration entry (entity)" },
  { id: "DEMO-WL-0188", name: "Teodric Mallen Vasquez-Orr", aliases: [], dateOfBirth: "1958-11-30", nationality: "Fictional", listing: "Demonstration entry" },
  // Like many real listings, this one records no date of birth — so a
  // resembling name with the same nationality cannot be ruled out from the
  // documents alone. That is the case where a person must decide.
  { id: "DEMO-WL-0219", name: "Rashid Kamal Hassan", aliases: ["Rasheed K. Hassan", "Rashid Kamaal Hasan"], dateOfBirth: null, nationality: "Bangladeshi", listing: "Demonstration entry — date of birth not recorded" },
  { id: "DEMO-WL-0256", name: "Ilsabet Quorne", aliases: ["Elizabeth Quorn"], dateOfBirth: "1980-07-07", nationality: "Fictional", listing: "Demonstration entry" },
  { id: "DEMO-WL-0301", name: "Bastian Krell Udovic", aliases: [], dateOfBirth: "1969-01-25", nationality: "Fictional", listing: "Demonstration entry" },
];

/**
 * A rough phonetic key per word, so transliterations meet: Rashed/Rashid,
 * Kamaal/Kamal, Hasan/Hassan all reduce to the same key. Keep the first
 * letter, drop later vowels, collapse doubled letters.
 */
export function phoneticKey(word: string): string {
  const w = word.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return "";
  const rest = w.slice(1).replace(/[aeiouy]/g, "");
  return (w[0] + rest).replace(/(.)\1+/g, "$1");
}

const keys = (name: string) =>
  new Set(name.split(/[\s.\-']+/).map(phoneticKey).filter((k) => k.length > 1));

/** Share of the shorter name's words that sound alike in the other, 0..1. */
export function nameSimilarity(a: string, b: string): number {
  const ka = keys(a);
  const kb = keys(b);
  if (!ka.size || !kb.size) return 0;
  const [small, large] = ka.size <= kb.size ? [ka, kb] : [kb, ka];
  let hits = 0;
  for (const k of small) if (large.has(k)) hits++;
  return hits / Math.max(ka.size, kb.size);
}

export interface ScreeningCandidate {
  entry: WatchlistEntry;
  similarity: number;
  matchedOn: string;
}

/** Entries that resemble the name closely enough for a closer look. */
export function screenName(name: string, threshold = 0.66): ScreeningCandidate[] {
  const out: ScreeningCandidate[] = [];
  for (const entry of DEMO_WATCHLIST) {
    let best = { similarity: 0, matchedOn: entry.name };
    for (const n of [entry.name, ...entry.aliases]) {
      const s = nameSimilarity(name, n);
      if (s > best.similarity) best = { similarity: s, matchedOn: n };
    }
    if (best.similarity >= threshold) out.push({ entry, ...best });
  }
  return out.sort((x, y) => y.similarity - x.similarity);
}
