import { cn } from "@/lib/utils";

/**
 * Kredal K-check monogram — Visual Identity v2 (see design.md §2).
 * A geometric K whose lower leg resolves into a checkmark: K for Kredal,
 * check for "verified / bank-ready".
 *
 * The square uses `currentColor` (defaults to ink via text-foreground) and the
 * strokes use the page background variable, so the mark works on light and
 * dark surfaces unchanged.
 */
export function LogoMark({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0 text-foreground", className)}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="currentColor" />
      {/* K stem */}
      <path
        d="M22 16v32"
        stroke="var(--background)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Upper arm of the K */}
      <path
        d="M44 16 24 33"
        stroke="var(--background)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Lower leg resolving into a check */}
      <path
        d="m28 37 8 11L50 28"
        stroke="var(--background)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-semibold tracking-[-0.02em] text-foreground",
        className
      )}
    >
      Kredal
    </span>
  );
}

/** Full lockup: mark + wordmark. Same export name as v1, so all usages work. */
export function KredalLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={22} />
      <LogoWordmark />
    </span>
  );
}
