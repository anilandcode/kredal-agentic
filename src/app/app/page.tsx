import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceForm } from "@/components/kredal/create-workspace-form";
import { CompanySearchTable } from "@/components/kredal/company-search-table";
import { StatTile } from "@/components/kredal/stat-tile";
import { EmptyState } from "@/components/kredal/empty-state";
import { getUserWorkspaces } from "@/lib/data/workspaces";
import { getWorkspaceCompanySummaries } from "@/lib/data/companies";

export default async function DashboardPage() {
  const workspaces = await getUserWorkspaces();

  if (workspaces.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-6 py-12">
        <div className="space-y-1.5 text-center">
          <h1 className="text-h1 font-semibold">Create your workspace</h1>
          <p className="text-body-sm text-muted-foreground">
            A workspace holds one or more companies you&apos;re preparing for
            a UAE bank.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <CreateWorkspaceForm />
        </div>
      </div>
    );
  }

  const workspace = workspaces[0];
  const isConsultant = workspace.workspace_type === "consultant";
  const companies = await getWorkspaceCompanySummaries(workspace.id);

  const readyCount = companies.filter((c) => c.status === "ready").length;
  const highRiskCount = companies.filter((c) => c.status === "high_risk").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-semibold">
            {isConsultant ? "Clients" : "Companies"}
          </h1>
          <p className="text-body-sm text-muted-foreground">
            {workspace.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/app/companies/new">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            {isConsultant ? "New client" : "New company"}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label={isConsultant ? "Clients" : "Companies"} value={companies.length} />
        <StatTile label="Bank-ready" value={readyCount} />
        <StatTile label="High risk" value={highRiskCount} />
      </div>

      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={isConsultant ? "No clients yet" : "No companies yet"}
          description={
            isConsultant
              ? "Add your first client to start tracking their bank-readiness."
              : "Add your first company to start a bank-readiness assessment."
          }
          action={
            <Button asChild size="sm">
              <Link href="/app/companies/new">
                <Plus className="h-4 w-4" strokeWidth={1.5} />
                {isConsultant ? "New client" : "New company"}
              </Link>
            </Button>
          }
        />
      ) : (
        <CompanySearchTable companies={companies} />
      )}
    </div>
  );
}
