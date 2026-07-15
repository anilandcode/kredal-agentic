import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getActiveWorkspace } from "@/lib/data/workspaces";
import { getWorkspaceMembers, getMyWorkspaceRole } from "@/lib/data/members";
import { MembersManager } from "@/components/kredal/members-manager";
import { RenameWorkspaceForm } from "@/components/kredal/rename-workspace-form";

export default async function WorkspaceSettingsPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/app");

  const [members, myRole] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    getMyWorkspaceRole(workspace.id),
  ]);
  const canManage = myRole === "owner" || myRole === "admin";

  return (
    <div className="space-y-8">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Dashboard
      </Link>

      <div>
        <h1 className="text-h1 font-semibold">Workspace settings</h1>
        <p className="text-body-sm text-muted-foreground">
          {workspace.name} ·{" "}
          {workspace.workspace_type === "consultant"
            ? "Consultant workspace"
            : "Company workspace"}
        </p>
      </div>

      {canManage ? (
        <section className="space-y-3">
          <h2 className="text-h3 font-semibold">Name</h2>
          <RenameWorkspaceForm
            workspaceId={workspace.id}
            currentName={workspace.name}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-h3 font-semibold">Members</h2>
          <p className="text-body-sm text-muted-foreground">
            Admins manage everything; members create and edit companies;
            viewers are read-only. Invitations are sent by email.
          </p>
        </div>
        <MembersManager
          workspaceId={workspace.id}
          members={members}
          canManage={canManage}
        />
      </section>
    </div>
  );
}
