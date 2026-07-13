import { redirect } from "next/navigation";
import { CompanyForm } from "@/components/kredal/company-form";
import { createCompany } from "@/app/actions/company";
import { getUserWorkspaces } from "@/lib/data/workspaces";

export default async function NewCompanyPage() {
  const workspaces = await getUserWorkspaces();
  const workspace = workspaces[0];
  if (!workspace) redirect("/app");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-h1 font-semibold">New company</h1>
        <p className="text-body-sm text-muted-foreground">
          Start with what you know — you can fill in the rest before running
          your assessment.
        </p>
      </div>
      <CompanyForm
        action={createCompany.bind(null, workspace.id)}
        submitLabel="Create company"
      />
    </div>
  );
}
