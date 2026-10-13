import { Lock } from "lucide-react";

/** Trust cue per DESIGN_SYSTEM.md §3 — factual only, no marketing embellishment. */
export function SecurityStrip() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
      Documents encrypted at rest &middot; Private storage &middot; You
      control deletion.
    </p>
  );
}
