/**
 * A reliability diagram: what a model claimed (x) against how often it was
 * right (y). On the diagonal, the model's confidence can be taken at its word.
 * Dots are verified outcomes per confidence band, sized by how many; the line
 * is the learned curve the engine actually routes on.
 */

interface Bin {
  n: number;
  correct: number;
  sumRaw: number;
}

const W = 260;
const H = 200;
const PAD = 28;
const x = (v: number) => PAD + v * (W - PAD - 8);
const y = (v: number) => H - PAD - v * (H - PAD - 10);

export function ReliabilityChart({ bins, curve, anchors }: { bins: Bin[]; curve: number[]; anchors: number[] }) {
  const maxN = Math.max(1, ...bins.map((b) => b.n));
  // Drawn at the same anchors the engine interpolates between, so the line is
  // exactly what routing uses.
  const path = curve.map((v, i) => `${i ? "L" : "M"}${x(anchors[i]).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-xs" role="img" aria-label="Reliability diagram">
      {/* axes */}
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(0)} className="stroke-border" />
      <line x1={x(0)} y1={y(0)} x2={x(0)} y2={y(1)} className="stroke-border" />
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <text x={x(t)} y={H - 10} textAnchor="middle" className="fill-muted-foreground text-[9px]">
            {Math.round(t * 100)}%
          </text>
          <text x={PAD - 6} y={y(t) + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      {/* perfect calibration */}
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} className="stroke-muted-foreground" strokeDasharray="3 3" strokeWidth={1} />
      {/* learned curve */}
      <path d={path} fill="none" className="stroke-brand" strokeWidth={2} />
      {/* verified outcomes */}
      {bins.map((b, i) =>
        b.n > 0 ? (
          <circle
            key={i}
            cx={x(b.sumRaw / b.n)}
            cy={y(b.correct / b.n)}
            r={3 + 6 * Math.sqrt(b.n / maxN)}
            className="fill-foreground/70"
          >
            <title>{`${b.n} checked at ~${Math.round((b.sumRaw / b.n) * 100)}% claimed: ${b.correct} right`}</title>
          </circle>
        ) : null
      )}
    </svg>
  );
}
