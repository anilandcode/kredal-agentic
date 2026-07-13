// Kredal domain types — mirrors the schema in supabase/migrations. Keep in sync manually
// until `supabase gen types typescript` is wired into the build.

export type UserRole = "founder" | "consultant" | "admin";

export type WorkspaceType = "single_company" | "consultant";

export type WorkspaceMemberRole = "owner" | "admin" | "member" | "viewer";

export type JurisdictionType =
  | "mainland"
  | "free_zone"
  | "financial_free_zone"
  | "unknown";

export type CompanyStatus =
  | "draft"
  | "in_review"
  | "ready"
  | "high_risk"
  | "archived";

export type DocumentType =
  | "trade_license"
  | "moa_aoa"
  | "shareholder_register"
  | "ubo_declaration"
  | "owner_passport"
  | "owner_emirates_id"
  | "owner_visa"
  | "proof_of_address"
  | "tenancy_or_office_agreement"
  | "invoice_or_contract"
  | "bank_statement"
  | "source_of_funds_evidence"
  | "business_plan"
  | "company_profile"
  | "other";

export type DocumentStatus =
  | "uploaded"
  | "parsed"
  | "needs_review"
  | "accepted"
  | "rejected";

export type RiskLevel = "low" | "medium" | "high";

export type ReportType =
  | "founder_readiness"
  | "consultant_checklist"
  | "bank_application_pack"
  | "rejection_recovery_pack";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  workspace_type: WorkspaceType;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceMemberRole;
  created_at: string;
}

export interface Company {
  id: string;
  workspace_id: string;
  legal_name: string;
  trade_license_number: string | null;
  emirate: string | null;
  jurisdiction_type: JurisdictionType;
  authority_name: string | null;
  license_activity_codes: string[] | null;
  incorporation_date: string | null;
  office_status: string | null;
  owner_nationality: string | null;
  owner_uae_residency_status: string | null;
  expected_monthly_turnover_aed: number | null;
  target_bank: string | null;
  target_account_type: string | null;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

export interface CompanySummary extends Company {
  reportCount: number;
  latestScore: number | null;
}

export interface CompanyOwner {
  id: string;
  company_id: string;
  full_name: string;
  nationality: string | null;
  ownership_percentage: number | null;
  is_ubo: boolean;
  uae_residency_status: string | null;
  emirates_id_last4: string | null;
  passport_country: string | null;
  created_at: string;
}

export interface CompanyDocument {
  id: string;
  company_id: string;
  uploaded_by: string;
  document_type: DocumentType;
  storage_path: string;
  original_filename: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  expiry_date: string | null;
  status: DocumentStatus;
  extracted_text: string | null;
  parse_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireResponse {
  id: string;
  company_id: string;
  section: string;
  question_key: string;
  answer_json: unknown;
  created_at: string;
  updated_at: string;
}

export interface CategoryScore {
  score: number;
  max: number;
  label: string;
  detail: string;
}

export interface ReadinessFlag {
  severity: RiskLevel;
  category: string;
  issue: string;
  fix: string;
}

export interface ReadinessAssessment {
  id: string;
  company_id: string;
  overall_score: number;
  risk_level: RiskLevel;
  category_scores: Record<string, CategoryScore>;
  flags: ReadinessFlag[];
  recommendations: string[];
  scoring_version: string;
  created_by: string;
  created_at: string;
}

export interface Report {
  id: string;
  company_id: string;
  assessment_id: string;
  report_type: ReportType;
  title: string;
  content_markdown: string;
  storage_path: string | null;
  created_by: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  workspace_id: string | null;
  company_id: string | null;
  user_id: string;
  event_type: string;
  event_data: unknown;
  created_at: string;
}
