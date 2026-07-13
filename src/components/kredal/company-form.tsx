"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CompanyActionState } from "@/app/actions/company";
import { JURISDICTION_LABELS, TARGET_BANKS, UAE_EMIRATES } from "@/lib/constants";
import type { Company } from "@/lib/types";

const initialState: CompanyActionState = {};

export function CompanyForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (
    state: CompanyActionState,
    formData: FormData
  ) => Promise<CompanyActionState>;
  defaultValues?: Partial<Company>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-h3 font-semibold">Company</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="legal_name">Legal company name</Label>
            <Input
              id="legal_name"
              name="legal_name"
              required
              defaultValue={defaultValues?.legal_name}
              placeholder="e.g. Al Falah General Trading LLC"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trade_license_number">Trade license number</Label>
            <Input
              id="trade_license_number"
              name="trade_license_number"
              defaultValue={defaultValues?.trade_license_number ?? undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="incorporation_date">Incorporation date</Label>
            <Input
              id="incorporation_date"
              name="incorporation_date"
              type="date"
              defaultValue={defaultValues?.incorporation_date ?? undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emirate">Emirate</Label>
            <Select name="emirate" defaultValue={defaultValues?.emirate ?? undefined}>
              <SelectTrigger id="emirate" className="w-full">
                <SelectValue placeholder="Select emirate" />
              </SelectTrigger>
              <SelectContent>
                {UAE_EMIRATES.map((emirate) => (
                  <SelectItem key={emirate} value={emirate}>
                    {emirate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jurisdiction_type">Jurisdiction</Label>
            <Select
              name="jurisdiction_type"
              defaultValue={defaultValues?.jurisdiction_type ?? "unknown"}
            >
              <SelectTrigger id="jurisdiction_type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(JURISDICTION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="authority_name">Authority / free zone name</Label>
            <Input
              id="authority_name"
              name="authority_name"
              defaultValue={defaultValues?.authority_name ?? undefined}
              placeholder="e.g. DMCC, Meydan, DED"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="license_activity_codes">
              License activity codes
            </Label>
            <Input
              id="license_activity_codes"
              name="license_activity_codes"
              defaultValue={defaultValues?.license_activity_codes?.join(", ")}
              placeholder="Comma-separated, e.g. 4610, 4620"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="office_status">Office / lease status</Label>
            <Input
              id="office_status"
              name="office_status"
              defaultValue={defaultValues?.office_status ?? undefined}
              placeholder="e.g. Ejari registered, flexi-desk"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-h3 font-semibold">Ownership</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="owner_nationality">Owner nationality</Label>
            <Input
              id="owner_nationality"
              name="owner_nationality"
              defaultValue={defaultValues?.owner_nationality ?? undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner_uae_residency_status">
              Owner UAE residency status
            </Label>
            <Input
              id="owner_uae_residency_status"
              name="owner_uae_residency_status"
              defaultValue={defaultValues?.owner_uae_residency_status ?? undefined}
              placeholder="e.g. UAE resident visa, non-resident"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-h3 font-semibold">Banking</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="expected_monthly_turnover_aed">
              Expected monthly turnover (AED)
            </Label>
            <Input
              id="expected_monthly_turnover_aed"
              name="expected_monthly_turnover_aed"
              type="number"
              min="0"
              step="1000"
              defaultValue={defaultValues?.expected_monthly_turnover_aed ?? undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target_bank">Target bank</Label>
            <Select name="target_bank" defaultValue={defaultValues?.target_bank ?? undefined}>
              <SelectTrigger id="target_bank" className="w-full">
                <SelectValue placeholder="Select target bank" />
              </SelectTrigger>
              <SelectContent>
                {TARGET_BANKS.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target_account_type">Target account type</Label>
            <Input
              id="target_account_type"
              name="target_account_type"
              defaultValue={defaultValues?.target_account_type ?? undefined}
              placeholder="e.g. current account, SME business account"
            />
          </div>
        </div>
      </section>

      {state.error ? (
        <p className="flex items-start gap-2 rounded-md border border-risk-high/30 bg-risk-high-bg px-3 py-2 text-sm text-risk-high-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
      </Button>
    </form>
  );
}
