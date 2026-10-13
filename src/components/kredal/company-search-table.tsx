"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyTable } from "@/components/kredal/company-table";
import { EmptyState } from "@/components/kredal/empty-state";
import { COMPANY_STATUS_LABELS } from "@/lib/constants";
import type { CompanySummary, CompanyStatus } from "@/lib/types";

type StatusFilter = CompanyStatus | "active" | "all";

export function CompanySearchTable({ companies }: { companies: CompanySummary[] }) {
  const [query, setQuery] = useState("");
  // "active" (everything except archived) is the default view.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchesQuery = c.legal_name.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? c.status !== "archived"
            : c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [companies, query, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            placeholder="Search companies…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active (default)</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(COMPANY_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching companies"
          description="Try a different search term or clear the status filter."
        />
      ) : (
        <CompanyTable companies={filtered} />
      )}
    </div>
  );
}
