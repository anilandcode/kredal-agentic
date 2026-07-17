import Link from "next/link";
import { KredalLogo } from "@/components/kredal/kredal-logo";
import { UserMenu } from "@/components/kredal/user-menu";
import {
  WorkspaceSwitcher,
  type SwitcherWorkspace,
} from "@/components/kredal/workspace-switcher";

export function AppTopbar({
  email,
  workspaces = [],
  activeWorkspaceId,
  showAdminLink = false,
}: {
  email: string;
  workspaces?: SwitcherWorkspace[];
  activeWorkspaceId?: string | null;
  showAdminLink?: boolean;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6">
      <div className="flex items-center gap-4">
        <Link href="/app">
          <KredalLogo />
        </Link>
        {workspaces.length > 0 && activeWorkspaceId ? (
          <>
            <span className="text-border">/</span>
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeId={activeWorkspaceId}
            />
          </>
        ) : null}
      </div>
      <UserMenu email={email} showAdminLink={showAdminLink} />
    </header>
  );
}
