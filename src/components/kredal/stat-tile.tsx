import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-1 text-h1 font-semibold tabular-nums">{value}</p>
    </div>
  );
}
