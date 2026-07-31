import { cn } from "@/lib/utils";

/**
 * Kredal mark — six quadrilaterals pinwheeling around a hollow centre, reading
 * as a rotating solid. See design.md §2.
 *
 * The supplied artwork came as a light/dark pair that differed only in fill
 * colour, so it collapses into this one component: every path is
 * `currentColor`, and `text-foreground` resolves to ink on cream and cream on
 * ink. There is no container square — the mark is the shape.
 *
 * The two opacity tiers (0.82 and 1) are the facet shading, not decoration;
 * flattening them turns the mark into a solid blob. They wash out below ~24px,
 * which is expected and fine — the silhouette is what carries it at that size.
 *
 * Figma's `clipPath` wrapper is deliberately dropped: its generated id would be
 * duplicated across every instance on a page, and the paths sit inside the
 * viewBox, so it clipped nothing.
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
      viewBox="0 0 100 100"
      fill="none"
      className={cn("shrink-0 text-foreground", className)}
      aria-hidden="true"
    >
      <g fill="currentColor" opacity="0.9">
        <path
          fillOpacity="0.82"
          d="M12.716 15.7284L2.2854 66.7298L2.3236 66.768L41.753 58.694L44.1095 47.1219L12.716 15.7284Z"
        />
        <path
          fillOpacity="0.82"
          d="M33.7363 98.1807L84.7183 87.7307L53.3249 56.3373L41.7529 58.694L33.6789 98.1233L33.7363 98.1807Z"
        />
        <path
          fillOpacity="0.82"
          d="M67.2265 2.78356L16.2255 13.2138L47.619 44.6073L59.2102 42.2315L67.2647 2.82176L67.2265 2.78356Z"
        />
        <path
          fillOpacity="0.82"
          d="M88.228 85.2164L98.658 34.215L98.6197 34.1767L59.2099 42.2313L56.8341 53.8225L88.228 85.2164Z"
        />
        <path d="M2.32373 66.7681L33.6791 98.1234L41.753 58.6941L2.32373 66.7681Z" />
        <path d="M98.6205 34.1763L67.2651 2.821L59.21 42.2316L98.6205 34.1763Z" />
      </g>
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

/**
 * Full lockup: mark + wordmark. The mark is set at 26 rather than the old 22 —
 * without a container square it reads optically smaller, and this matches the
 * wordmark's cap height.
 */
export function KredalLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={26} />
      <LogoWordmark />
    </span>
  );
}
