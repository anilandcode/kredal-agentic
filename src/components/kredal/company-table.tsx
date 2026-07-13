import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompanyStatusBadge } from "@/components/kredal/status-badge";
import { JURISDICTION_LABELS } from "@/lib/constants";
import type { CompanySummary } from "@/lib/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CompanyTable({ companies }: { companies: CompanySummary[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Company</TableHead>
            <TableHead>Jurisdiction</TableHead>
            <TableHead>Target bank</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Reports</TableHead>
            <TableHead className="text-right">Last activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id} className="cursor-pointer">
              <TableCell className="font-medium">
                <Link
                  href={`/app/companies/${company.id}`}
                  className="hover:underline"
                >
                  {company.legal_name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {JURISDICTION_LABELS[company.jurisdiction_type]}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {company.target_bank ?? "—"}
              </TableCell>
              <TableCell>
                <CompanyStatusBadge status={company.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {company.latestScore ?? "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {company.reportCount}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatDate(company.updated_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
