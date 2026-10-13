"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Click-to-copy colour swatch for the style guide. */
export function CopySwatch({
  name,
  hex,
  className,
  large = false,
}: {
  name: string;
  hex: string;
  className?: string;
  large?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn("group text-left", className)}
      title={`Copy ${hex}`}
    >
      <span
        className={cn(
          "block w-full rounded-xl border border-border transition-transform group-active:scale-[0.98]",
          large ? "h-20" : "h-14"
        )}
        style={{ backgroundColor: hex }}
      />
      <span className="mt-2 block truncate text-caption font-medium text-foreground">
        {name}
      </span>
      <span className="block font-mono text-caption text-muted-foreground">
        {copied ? "copied ✓" : hex}
      </span>
    </button>
  );
}
