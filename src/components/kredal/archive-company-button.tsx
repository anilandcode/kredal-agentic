"use client";

import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveCompany } from "@/app/actions/company";

export function ArchiveCompanyButton({
  companyId,
  legalName,
}: {
  companyId: string;
  legalName: string;
}) {
  return (
    <form
      action={archiveCompany.bind(null, companyId)}
      onSubmit={(e) => {
        if (
          !confirm(
            `Archive ${legalName}? It will be hidden from your dashboard but nothing is deleted.`
          )
        )
          e.preventDefault();
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        <Archive className="h-4 w-4" strokeWidth={1.5} />
        Archive
      </Button>
    </form>
  );
}
