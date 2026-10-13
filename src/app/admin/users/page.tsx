import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/kredal/empty-state";
import { AdminUserActions } from "@/components/kredal/admin/admin-user-actions";
import { requirePlatformAdmin } from "@/lib/admin/guard";
import { listAllUsers } from "@/lib/admin/data";

function isBanned(bannedUntil: string | null): boolean {
  return !!bannedUntil && new Date(bannedUntil) > new Date();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user: adminUser } = await requirePlatformAdmin();
  const { q } = await searchParams;
  const users = await listAllUsers(q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-semibold">Users</h1>
        <p className="text-body-sm text-muted-foreground">
          Every account on the platform. Deactivating bans sign-in; it never
          deletes data.
        </p>
      </div>

      <form className="flex max-w-md gap-2" action="/admin/users">
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by email or name…"
        />
        <Button type="submit" variant="outline">
          <Search className="h-4 w-4" strokeWidth={1.5} />
          Search
        </Button>
      </form>

      {users.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No users found"
          description={q ? `Nothing matches "${q}".` : "No accounts yet."}
        />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Workspaces</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const banned = isBanned(u.banned_until);
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.email}</div>
                      {u.full_name ? (
                        <div className="text-caption text-muted-foreground">
                          {u.full_name}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {banned ? (
                        <Badge variant="secondary">Deactivated</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {u.workspace_count}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(u.last_sign_in_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminUserActions
                        userId={u.id}
                        banned={banned}
                        isSelf={u.id === adminUser.id}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
