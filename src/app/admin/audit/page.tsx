import { ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/kredal/empty-state";
import { listAuditEvents } from "@/lib/admin/data";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const { rows, eventTypes } = await listAuditEvents({
    eventType: type || undefined,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-semibold">Audit log</h1>
        <p className="text-body-sm text-muted-foreground">
          Append-only record of actions across all workspaces. Latest 100 shown.
        </p>
      </div>

      <form className="flex max-w-md items-center gap-2" action="/admin/audit">
        <select
          name="type"
          defaultValue={type ?? ""}
          className="h-9 flex-1 rounded-full border border-border bg-background px-4 text-body-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All event types</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No events"
          description={type ? `No "${type}" events recorded.` : "No audit events yet."}
        />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatTime(e.created_at)}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-caption">
                      {e.event_type}
                    </code>
                  </TableCell>
                  <TableCell>{e.user_name ?? "—"}</TableCell>
                  <TableCell>{e.workspace_name ?? "—"}</TableCell>
                  <TableCell className="max-w-md">
                    <span className="block truncate text-caption text-muted-foreground">
                      {Object.keys(e.event_data).length > 0
                        ? JSON.stringify(e.event_data)
                        : "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
