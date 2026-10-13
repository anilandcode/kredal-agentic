import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { requiredDocsFor } from "@/lib/checklist";
import type { Company, CompanyDocument, DocumentType } from "@/lib/types";

/**
 * Agent 10 — compliance monitor. Deterministically scans a company file for
 * time-based compliance exposure: expiring documents, the corporate-tax
 * deadline, VAT posture, WPS, and target-bank document gaps. Pure function —
 * same input contract as the scoring engine, no I/O.
 */

export type RadarSeverity = "high" | "medium" | "low";

export interface RadarItem {
  severity: RadarSeverity;
  label: string;
  detail: string;
}

const CT_DEADLINE = new Date("2026-09-30T23:59:59Z");
const DAY_MS = 24 * 60 * 60 * 1000;
// AED 375,000/year VAT registration threshold ≈ AED 31,250/month.
const VAT_MONTHLY_THRESHOLD_AED = 31250;

const docLabel = (t: string) =>
  DOCUMENT_TYPE_LABELS[t as DocumentType] ?? t;

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / DAY_MS);
}

/** Expiry from the AI-extracted JSON, when extraction found one. */
function extractedExpiry(doc: CompanyDocument): string | null {
  if (!doc.extracted_text) return null;
  try {
    const parsed = JSON.parse(doc.extracted_text) as { expiry_date?: unknown };
    return typeof parsed.expiry_date === "string" ? parsed.expiry_date : null;
  } catch {
    return null;
  }
}

export function buildComplianceRadar(input: {
  company: Company;
  documents: CompanyDocument[];
  answers: Record<string, unknown>;
}): RadarItem[] {
  const { company, documents, answers } = input;
  const items: RadarItem[] = [];

  // --- document expiries (manual expiry_date column + AI-extracted) ---
  for (const doc of documents) {
    if (doc.status === "rejected") continue;
    const expiry = doc.expiry_date ?? extractedExpiry(doc);
    const days = daysUntil(expiry);
    if (days === null) continue;
    const name = docLabel(doc.document_type);
    if (days < 0) {
      items.push({
        severity: "high",
        label: `${name} has expired`,
        detail: `Expired ${Math.abs(days)} day(s) ago — banks reject files with expired documents. Replace it before applying.`,
      });
    } else if (days <= 30) {
      items.push({
        severity: "high",
        label: `${name} expires in ${days} day(s)`,
        detail: "Will likely go stale during bank review. Renew now.",
      });
    } else if (days <= 60) {
      items.push({
        severity: "medium",
        label: `${name} expires in ${days} day(s)`,
        detail: "Renew before starting a bank application.",
      });
    }
  }

  // --- corporate tax (filing deadline 30 Sept 2026 for the first period) ---
  const ct = String(answers.corporate_tax_status ?? "");
  const ctDays = Math.floor((CT_DEADLINE.getTime() - Date.now()) / DAY_MS);
  if (ct === "not_yet_registered" || ct === "unknown" || ct === "") {
    items.push({
      severity: ctDays <= 90 ? "high" : "medium",
      label: "Corporate tax registration unresolved",
      detail: `First filing deadline is 30 Sept 2026 (${ctDays} day(s) away). Banks increasingly ask for the CT registration number.`,
    });
  }

  // --- VAT posture near the threshold ---
  const vat = String(answers.vat_status ?? "");
  const turnover = company.expected_monthly_turnover_aed;
  if (
    (vat === "unknown" || vat === "not_yet_registered" || vat === "") &&
    turnover != null &&
    turnover >= VAT_MONTHLY_THRESHOLD_AED
  ) {
    items.push({
      severity: "medium",
      label: "VAT status unclear at your turnover",
      detail:
        "Your stated turnover is at or above the mandatory VAT registration threshold (AED 375k/year). Resolve registration before the bank asks.",
    });
  }

  // --- WPS when there are employees ---
  const hasEmployees = String(answers.has_employees ?? "") === "yes";
  const wps = String(answers.wps_status ?? "");
  if (hasEmployees && wps !== "set_up") {
    items.push({
      severity: wps === "not_set_up" ? "high" : "medium",
      label: "WPS not fully set up",
      detail:
        "Wage Protection System registration is enforced with per-employee fines and blocks payroll through the new account.",
    });
  }

  // --- target-bank document gaps ---
  const { required } = requiredDocsFor(company);
  const have = new Set(
    documents.filter((d) => d.status !== "rejected").map((d) => d.document_type)
  );
  const missing = required.filter((t) => !have.has(t));
  if (missing.length > 0) {
    items.push({
      severity: "medium",
      label: `${missing.length} required document(s) missing`,
      detail: `Still needed${company.target_bank ? ` for ${company.target_bank}` : ""}: ${missing
        .slice(0, 3)
        .map(docLabel)
        .join(", ")}${missing.length > 3 ? "…" : ""}.`,
    });
  }

  const order: RadarSeverity[] = ["high", "medium", "low"];
  return items.sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)
  );
}
