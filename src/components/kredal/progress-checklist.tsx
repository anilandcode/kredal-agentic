import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChecklistStep {
  key: string;
  label: string;
  href?: string;
  state: "done" | "current" | "upcoming";
}

export function ProgressChecklist({ steps }: { steps: ChecklistStep[] }) {
  const doneCount = steps.filter((s) => s.state === "done").length;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-3 text-caption text-muted-foreground">
        {doneCount} of {steps.length} steps complete
      </p>
      <ol className="space-y-1">
        {steps.map((step) => {
          const content = (
            <span
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-body-sm",
                step.state === "current" && "bg-accent text-accent-foreground",
                step.state === "upcoming" && "text-muted-foreground",
                step.href && "hover:bg-muted"
              )}
            >
              {step.state === "done" ? (
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-risk-low text-white">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </span>
              ) : step.state === "current" ? (
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
              ) : (
                <Circle
                  className="h-5 w-5 flex-shrink-0 text-border"
                  strokeWidth={1.5}
                />
              )}
              {step.label}
            </span>
          );

          return (
            <li key={step.key}>
              {step.href ? <Link href={step.href}>{content}</Link> : content}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
