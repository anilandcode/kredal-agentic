"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { QUESTIONNAIRE_SECTIONS } from "@/lib/constants";

export function SectionNav({
  activeSection,
  completedSections,
  onSelect,
}: {
  activeSection: string;
  completedSections: Set<string>;
  onSelect: (section: string) => void;
}) {
  return (
    <nav className="rounded-lg border border-border bg-card p-2">
      <p className="px-2 py-1.5 text-caption text-muted-foreground">
        {completedSections.size} of {QUESTIONNAIRE_SECTIONS.length} sections started
      </p>
      <ol className="space-y-0.5">
        {QUESTIONNAIRE_SECTIONS.map((section, i) => {
          const done = completedSections.has(section.key);
          const active = section.key === activeSection;
          return (
            <li key={section.key}>
              <button
                type="button"
                onClick={() => onSelect(section.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-body-sm",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {done ? (
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-risk-low text-white">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                ) : (
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border text-caption">
                    {i + 1}
                  </span>
                )}
                {section.title}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
