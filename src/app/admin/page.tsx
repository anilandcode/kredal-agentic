import { StatTile } from "@/components/kredal/stat-tile";
import { getPlatformStats } from "@/lib/admin/data";

/** Last 12 ISO weeks (Mondays, UTC) — matches Postgres date_trunc('week', …). */
function lastTwelveWeeks(signups: { week: string; n: number }[]) {
  const byWeek = new Map(signups.map((s) => [s.week.slice(0, 10), s.n]));
  const monday = new Date();
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));

  const weeks: { key: string; label: string; n: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const key = d.toISOString().slice(0, 10);
    weeks.push({
      key,
      label: d.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      n: byWeek.get(key) ?? 0,
    });
  }
  return weeks;
}

export default async function AdminOverviewPage() {
  const stats = await getPlatformStats();
  const weeks = lastTwelveWeeks(stats.signups_by_week);
  const max = Math.max(1, ...weeks.map((w) => w.n));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 font-semibold">Platform overview</h1>
        <p className="text-body-sm text-muted-foreground">
          Live totals across all workspaces.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Users" value={stats.users} />
        <StatTile label="Workspaces" value={stats.workspaces} />
        <StatTile label="Companies" value={stats.companies} />
        <StatTile label="Assessments" value={stats.assessments} />
        <StatTile label="Documents" value={stats.documents} />
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-h3 font-semibold">Signups by week</h2>
        <p className="text-body-sm text-muted-foreground">Last 12 weeks.</p>
        <div className="mt-6 flex h-44 items-end gap-2">
          {weeks.map((w) => (
            <div key={w.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-caption tabular-nums text-muted-foreground">
                {w.n > 0 ? w.n : ""}
              </span>
              <div
                className="w-full max-w-10 rounded-t-sm"
                style={{
                  height: `${Math.max(2, Math.round((w.n / max) * 110))}px`,
                  background: "var(--chart-1)",
                }}
              />
              <span className="text-caption text-muted-foreground">{w.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
