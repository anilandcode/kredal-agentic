import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      <div className="space-y-1">
        <p className="text-body font-medium">{title}</p>
        <p className="text-body-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
