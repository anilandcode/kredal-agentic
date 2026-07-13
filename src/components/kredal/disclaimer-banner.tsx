import { Info } from "lucide-react";
import { KREDAL_DISCLAIMER } from "@/lib/constants";

export function DisclaimerBanner() {
  return (
    <p className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-body-sm text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
      {KREDAL_DISCLAIMER}
    </p>
  );
}
