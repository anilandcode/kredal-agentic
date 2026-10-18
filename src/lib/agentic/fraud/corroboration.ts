/**
 * How much of the visual inspector's doubt survives the deterministic checks.
 *
 * When Gemini says a statement is unedited at, say, 95%, its 5% doubt is the
 * chance of an edit it missed. But an edit it missed would also have had to
 * leave no trace in the file's history and keep the totals consistent. Each of
 * those independent checks that *passed* is evidence against the edit, so each
 * one cuts the surviving doubt.
 *
 * Without this, the clean evidence counted for nothing: a clean statement that
 * Gemini rated 95% unedited came out "possible alteration (5%)" and was sent to
 * a person, while the same file rated 99% cleared — the verdict flipped on the
 * model's phrasing, not on the evidence.
 *
 * The factor is an explicit assumption, stated here: at most half of edits that
 * evade the visual inspection also evade any one deterministic check. Doubt is
 * only ever reduced for a *clean* visual verdict; an "edited" verdict is never
 * discounted — clearing evidence must not be able to mask a detected edit.
 */
export const EVADE_PER_PASSED_CHECK = 0.5;

export function corroboratedDoubt(modelDoubt: number, passedChecks: number): number {
  const d = Math.min(1, Math.max(0, modelDoubt));
  return d * EVADE_PER_PASSED_CHECK ** Math.max(0, passedChecks);
}
