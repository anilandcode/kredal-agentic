import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function KredalLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight text-foreground",
        className
      )}
    >
      <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={1.5} />
      <span>Kredal</span>
    </span>
  );
}
