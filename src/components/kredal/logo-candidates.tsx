/**
 * Geometric icon candidates for the Kredal mark — EXPLORATION ONLY.
 *
 * The live mark is `LogoMark` in kredal-logo.tsx and is unchanged; nothing here
 * is wired into the header, favicon, OG image, deck or docs. These render side
 * by side at /styleguide/logo so a direction can be chosen deliberately.
 *
 * Shared constraints, so the comparison is fair:
 *  - 64×64 viewBox, rx 14 rounded square, `currentColor` field, strokes in
 *    `var(--background)` — identical to the live mark, so each works on cream
 *    and on ink without a second asset.
 *  - Stroke weight 7 with round caps: legible down to 16px in a browser tab.
 *  - Conservative geometry — no gradients, no illustration, no wordmark inside.
 */
import { cn } from "@/lib/utils";

type MarkProps = { className?: string; size?: number };

function Frame({
  className,
  size = 24,
  children,
}: MarkProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0 text-foreground", className)}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="currentColor" />
      {children}
    </svg>
  );
}

const stroke = {
  stroke: "var(--background)",
  strokeWidth: 7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
} as const;

/** A — Ledger K. The K's arms become two stacked rules: a K read as a filing. */
export function MarkLedgerK(p: MarkProps) {
  return (
    <Frame {...p}>
      <path d="M21 16v32" {...stroke} />
      <path d="M34 25h13" {...stroke} />
      <path d="M34 39h9" {...stroke} />
    </Frame>
  );
}

/** B — Gate. Two uprights and a crossbar: the approval threshold a file passes. */
export function MarkGate(p: MarkProps) {
  return (
    <Frame {...p}>
      <path d="M20 48V22" {...stroke} />
      <path d="M44 48V22" {...stroke} />
      <path d="M20 30h24" {...stroke} />
    </Frame>
  );
}

/** C — Keystone. A chevron over a stem — upward readiness, no literal tick. */
export function MarkKeystone(p: MarkProps) {
  return (
    <Frame {...p}>
      <path d="m19 32 13-13 13 13" {...stroke} />
      <path d="M32 45V24" {...stroke} />
    </Frame>
  );
}

/** D — Bracket K. An open bracket plus stem: structured data, still a K. */
export function MarkBracketK(p: MarkProps) {
  return (
    <Frame {...p}>
      <path d="M22 16v32" {...stroke} />
      <path d="M46 17h-8v30h8" {...stroke} />
    </Frame>
  );
}

export const LOGO_CANDIDATES = [
  {
    key: "A",
    name: "Ledger K",
    Mark: MarkLedgerK,
    note: "Closest to the current mark. Keeps the K silhouette but swaps the check for two ledger rules — reads as records, not as a claim of approval.",
  },
  {
    key: "B",
    name: "Gate",
    Mark: MarkGate,
    note: "Most abstract. A threshold the file passes through. Strongest at 16px; loses the K entirely, so the wordmark has to carry the name.",
  },
  {
    key: "C",
    name: "Keystone",
    Mark: MarkKeystone,
    note: "Upward chevron over a stem. Confident, finance-adjacent, no tick. Risk: chevron-over-line is a common fintech shape.",
  },
  {
    key: "D",
    name: "Bracket K",
    Mark: MarkBracketK,
    note: "K stem beside a data bracket. Signals structured extraction; the most 'software' of the four.",
  },
] as const;
