import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/kredal/empty-state";
import { DeleteWorkspaceDialog } from "@/components/kredal/admin/delete-workspace-dialog";
import { listAllWorkspaces } from "@/lib/admin/data";

export default async function AdminWorkspacesPage() {
  const workspaces = await listAllWorkspaces();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-semibold">Workspaces</h1>
        <p className="text-body-sm text-muted-foreground">
          All workspaces on the platform. Deleting one removes its data and
          stored files permanently.
        </p>
      </div>

      {workspaces.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No workspaces yet"
          description="Workspaces appear here as users create them."
        />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workspace</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Companies</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {w.workspace_type === "consultant"
                        ? "Consultant"
                        : "Single company"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{w.member_count}</TableCell>
                  <TableCell className="tabular-nums">{w.company_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(w.created_at).toLocaleDateString("en", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteWorkspaceDialog
                      workspaceId={w.id}
                      workspaceName={w.name}
                    />
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
