/**
 * Icon candidates for the Kredal mark — EXPLORATION ONLY.
 *
 * The live mark is `LogoMark` in kredal-logo.tsx and is unchanged; nothing here
 * is wired into the header, favicon, OG image, deck or docs. These render at
 * /styleguide/logo so a direction can be chosen deliberately.
 *
 * The brief, from three reference marks: **filled mass, structural negative
 * space, and the shape is the mark** — not a drawing placed inside a badge. So:
 *
 *  - Every mark is a free-standing `<path>` fill in `currentColor`. No strokes,
 *    no background square. Stroke-based marks read as thin and generic at the
 *    sizes that matter, which is what sank the previous set.
 *  - Counters are cut with `fillRule="evenodd"`, so the gap is part of the
 *    geometry rather than a second shape laid on top. That is what makes the
 *    negative space structural.
 *  - Drawn on a 64×64 grid centred on (32,32), so all three sit optically
 *    level with each other and with the wordmark.
 *
 * A favicon needs a filled field, so `Badged` wraps any of these in the brand
 * rounded square with the mark knocked out in the page colour.
 */
import { cn } from "@/lib/utils";

type MarkProps = { className?: string; size?: number };

function Glyph({
  className,
  size = 24,
  d,
}: MarkProps & { d: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0 text-foreground", className)}
      aria-hidden="true"
    >
      <path d={d} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** The same geometry on a filled field — what a favicon or app icon needs. */
export function Badged({
  className,
  size = 24,
  d,
}: MarkProps & { d: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0 text-foreground", className)}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <path d={d} fill="var(--background)" fillRule="evenodd" />
    </svg>
  );
}

/**
 * H — Assembly. Four sheets rotating into a pack. One blade is drawn, then
 * rotated 90° three times about the centre, so the four-fold symmetry is exact
 * by construction. The blades never meet: what is left between them is a
 * pinwheeling cross, and that gap is the mark.
 */
export const ASSEMBLY_D = [
  // Each blade is an L — a sheet with its inner corner stepped away — so the
  // four read as one rotating mass rather than four loose wedges, and the slot
  // left between them pinwheels.
  // 90°: (x,y) -> (64-y, x)   180°: (x,y) -> (64-x, 64-y)   270°: (x,y) -> (y, 64-x)
  "M34 4 H60 V30 H46 V18 H34 Z",
  "M60 34 V60 H34 V46 H46 V34 Z",
  "M30 60 H4 V34 H18 V46 H30 Z",
  "M4 30 V4 H30 V18 H18 V30 Z",
].join(" ");

export function MarkAssembly(p: MarkProps) {
  return <Glyph {...p} d={ASSEMBLY_D} />;
}

/**
 * I — Interlock. Two rings, overlapping. Under `evenodd` the overlap cancels to
 * nothing, so the two links appear to pass through each other — the same trick
 * the reference ribbon uses. Reads as: your file, checked against what the bank
 * asks for.
 */
/** A circle as a path, so rings can be combined in one `evenodd` fill. */
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

export const INTERLOCK_D = [
  // Two rings sharing a wide overlap. Squares read as boxes at this size;
  // circles read as links.
  circle(23, 32, 19),
  circle(23, 32, 10),
  circle(41, 32, 19),
  circle(41, 32, 10),
].join(" ");

export function MarkInterlock(p: MarkProps) {
  return <Glyph {...p} d={INTERLOCK_D} />;
}

/**
 * J — Aperture. A solid disc with a wedge bitten out of one side and a diamond
 * counter at its centre. The mass carries the weight; the two cuts carry the
 * meaning — the gap in the file is the thing you can actually see.
 */
export const APERTURE_D = [
  // disc
  "M32 4 A28 28 0 1 1 31.99 4 Z",
  // diamond counter
  "M32 22 L42 32 L32 42 L22 32 Z",
  // wedge, running past the edge so it cuts the silhouette
  "M68 20 L68 44 L38 32 Z",
].join(" ");

export function MarkAperture(p: MarkProps) {
  return <Glyph {...p} d={APERTURE_D} />;
}

export const LOGO_CANDIDATES = [
  {
    key: "H",
    name: "Assembly",
    d: ASSEMBLY_D,
    Mark: MarkAssembly,
    note: "Four sheets rotating into a pack, with a pinwheeling slot left between them. The most distinctive of the three and the densest at 16px. Watch for: the silhouette sits close to a plus sign, which carries a medical association.",
  },
  {
    key: "I",
    name: "Interlock",
    d: INTERLOCK_D,
    Mark: MarkInterlock,
    note: "Two links passing through each other — your file checked against what the bank asks for. The clearest at small sizes and the easiest to explain. Watch for: two overlapping circles is close to Mastercard's mark, which matters more here than it would outside payments.",
  },
  {
    key: "J",
    name: "Aperture",
    d: APERTURE_D,
    Mark: MarkAperture,
    note: "A solid disc with a wedge cut from its edge and a diamond at its centre. The heaviest silhouette, so it survives smallest, and the only one with an off-centre axis. Watch for: a notched circle is the most generic of the three in fintech.",
  },
] as const;
