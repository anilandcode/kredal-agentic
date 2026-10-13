import { notFound } from "next/navigation";
import { CompanyForm } from "@/components/kredal/company-form";
import { updateCompany } from "@/app/actions/company";
import { getCompany } from "@/lib/data/companies";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = await getCompany(companyId);
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-h1 font-semibold">Edit {company.legal_name}</h1>
      </div>
      <CompanyForm
        action={updateCompany.bind(null, companyId)}
        defaultValues={company}
        submitLabel="Save changes"
      />
    </div>
  );
}
