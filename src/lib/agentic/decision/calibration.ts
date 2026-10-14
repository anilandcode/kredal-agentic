/**
 * Calibration: how far to trust a model's stated confidence.
 *
 * A model that says it is 92% sure is not right 92% of the time. Each time a
 * human confirms or overturns a model judgment, that outcome lands in the bin
 * for the model's raw confidence. The calibrated probability is then what the
 * history says, not what the model claims — and every routing decision in
 * `policy.ts` is made on the calibrated value.
 *
 * This is the measurable half of "self-learning": the same model output gets
 * routed differently once the system has learned how often that model, at
 * that confidence, is actually right.
 *
 * Method: equal-width bins over [0, 1]. Each bin's accuracy is a posterior mean
 * with a prior centred on the bin's own midpoint, so an empty history returns
 * (close to) the raw value and a thin history only nudges it. Pool-adjacent-
 * violators then forces the curve to be monotone — a higher raw confidence can
 * never map to a lower calibrated one, however noisy the early data.
 */

export interface CalibrationBin {
  /** Judgments that landed in this bin and were then checked by a human. */
  n: number;
  /** How many of those the human confirmed. */
  correct: number;
  /** Sum of raw confidences, for the mean-confidence term in ECE. */
  sumRaw: number;
}

export interface CalibratorState {
  bins: CalibrationBin[];
  /**
   * Prior strength, in pseudo-observations. Higher = needs more history before
   * it moves away from the raw value.
   */
  priorStrength: number;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export class Calibrator {
  private readonly bins: CalibrationBin[];
  private readonly priorStrength: number;

  constructor(state?: Partial<CalibratorState> & { binCount?: number }) {
    const binCount = state?.bins?.length ?? state?.binCount ?? 10;
    this.bins =
      state?.bins?.map((b) => ({ ...b })) ??
      Array.from({ length: binCount }, () => ({ n: 0, correct: 0, sumRaw: 0 }));
    this.priorStrength = state?.priorStrength ?? 4;
  }

  private binIndex(raw: number): number {
    return Math.min(this.bins.length - 1, Math.floor(clamp01(raw) * this.bins.length));
  }

  private center(i: number): number {
    return (i + 0.5) / this.bins.length;
  }

  /** Record a human-checked outcome for a judgment the model made at `raw`. */
  observe(raw: number, wasCorrect: boolean): void {
    const bin = this.bins[this.binIndex(raw)];
    bin.n += 1;
    bin.sumRaw += clamp01(raw);
    if (wasCorrect) bin.correct += 1;
  }

  /** Total human-checked outcomes behind this calibrator. */
  get observations(): number {
    return this.bins.reduce((s, b) => s + b.n, 0);
  }

  /** Per-bin estimates after smoothing and the monotonicity constraint. */
  curve(): number[] {
    const a = this.priorStrength;
    // Posterior mean per bin; weight = evidence behind it.
    const blocks = this.bins.map((b, i) => ({
      value: (b.correct + a * this.center(i)) / (b.n + a),
      weight: b.n + a,
      size: 1,
    }));

    // Pool-adjacent-violators: merge any block that is higher than the next.
    const stack: { value: number; weight: number; size: number }[] = [];
    for (const block of blocks) {
      stack.push({ ...block });
      while (stack.length > 1) {
        const top = stack[stack.length - 1];
        const prev = stack[stack.length - 2];
        if (prev.value <= top.value) break;
        const weight = prev.weight + top.weight;
        stack.splice(stack.length - 2, 2, {
          value: (prev.value * prev.weight + top.value * top.weight) / weight,
          weight,
          size: prev.size + top.size,
        });
      }
    }
    return stack.flatMap((b) => Array<number>(b.size).fill(b.value));
  }

  /**
   * The probability that a model judgment made at `raw` confidence is correct,
   * given everything humans have checked so far. Linear between bin centres;
   * beyond the outermost centres, it continues parallel to the diagonal.
   *
   * Not flat: holding the edge flat made an empty curve map 99% to 95%, so a
   * single wrong answer at 55% — evidence about 55% claims only — appeared to
   * cut trust in every 99% claim. With no evidence near the edge, the edge
   * must follow the raw value.
   */
  calibrate(raw: number): number {
    const curve = this.curve();
    const x = clamp01(raw);
    const first = this.center(0);
    const last = this.center(curve.length - 1);
    if (x <= first) return clamp01(curve[0] - (first - x));
    if (x >= last) return clamp01(curve[curve.length - 1] + (x - last));
    const pos = x * curve.length - 0.5;
    const i = Math.floor(pos);
    const t = pos - i;
    return curve[i] * (1 - t) + curve[i + 1] * t;
  }

  /**
   * Expected calibration error of the *raw* confidences: the evidence-weighted
   * gap between what the model claimed and how often it was right. 0 = the
   * model's confidence can be taken at face value.
   */
  expectedCalibrationError(): number {
    const total = this.observations;
    if (total === 0) return 0;
    return this.bins.reduce((sum, b) => {
      if (b.n === 0) return sum;
      return sum + (b.n / total) * Math.abs(b.correct / b.n - b.sumRaw / b.n);
    }, 0);
  }

  toJSON(): CalibratorState {
    return { bins: this.bins.map((b) => ({ ...b })), priorStrength: this.priorStrength };
  }
}
