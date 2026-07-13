import Link from "next/link";
import { Building2 } from "lucide-react";
import { KredalLogo } from "@/components/kredal/kredal-logo";
import { UserMenu } from "@/components/kredal/user-menu";

export function AppTopbar({
  email,
  workspaceName,
}: {
  email: string;
  workspaceName?: string | null;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6">
      <div className="flex items-center gap-4">
        <Link href="/app">
          <KredalLogo />
        </Link>
        {workspaceName ? (
          <>
            <span className="text-border">/</span>
            <span className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
              <Building2 className="h-4 w-4" strokeWidth={1.5} />
              {workspaceName}
            </span>
          </>
        ) : null}
      </div>
      <UserMenu email={email} />
    </header>
  );
}
