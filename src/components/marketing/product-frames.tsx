/**
 * Product visuals for the marketing page.
 *
 * These are NOT mockups. Each frame renders the same components the dashboard
 * renders, fed by `@/lib/marketing/demo-fixture` — whose numbers come out of
 * the real scoring engine evaluating the demo company. If the product changes,
 * these change with it, because they are the product.
 *
 * Everything imported here is verified free of `server-only` and of Supabase,
 * so it is safe on a public page. `MarkdownReport` stays server-rendered (no
 * "use client" in this file) so anonymous visitors pay no extra client JS for
 * react-markdown.
 */
import { BankMatchCard } from "@/components/kredal/bank-match-card";
import { CategoryScoreBar } from "@/components/kredal/category-score-bar";
import { CompanyTable } from "@/components/kredal/company-table";
import { MarkdownReport } from "@/components/kredal/markdown-report";
import { RiskCard } from "@/components/kredal/risk-card";
import { ScoreGauge } from "@/components/kredal/score-gauge";
import { requiredDocsFor } from "@/lib/checklist";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import {
  DEMO_ASSESSMENT,
  DEMO_BANK_MATCHES,
  DEMO_COMPANY,
  DEMO_DOCUMENTS,
  DEMO_PACK_MARKDOWN,
  DEMO_PORTFOLIO,
} from "@/lib/marketing/demo-fixture";
import type { DocumentType } from "@/lib/types";

/**
 * Window chrome. `caption` is not decoration — every frame must say out loud
 * that this is a demo workspace, so a company name is never mistaken for a
 * customer.
 */
function Chrome({
  label,
  caption = "Demo workspace — sample data",
  children,
}: {
  label: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full rounded-md border border-border bg-card p-1.5 shadow-2xl shadow-black/20">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="mx-auto truncate text-caption text-muted-foreground">
          {label}
        </span>
      </div>
      {/* Links inside these frames point into /app, which a logged-out visitor
          cannot reach — so the whole surface is inert. */}
      <div className="pointer-events-none rounded-sm bg-background p-5">
        {children}
      </div>
      <p className="px-3 py-2 text-center text-caption text-muted-foreground">
        {caption}
      </p>
    </div>
  );
}

/** The assessment screen: real gauge, real category bars, real flags. */
export function AssessmentFrame() {
  const categories = Object.entries(DEMO_ASSESSMENT.category_scores).slice(0, 4);
  const flags = DEMO_ASSESSMENT.flags.slice(0, 3);

  return (
    <Chrome label={`Kredal — ${DEMO_COMPANY.legal_name}`}>
      <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
        <div className="flex items-center justify-center rounded-md border border-border bg-card px-4 py-3">
          <ScoreGauge
            score={DEMO_ASSESSMENT.overall_score}
            riskLevel={DEMO_ASSESSMENT.risk_level}
          />
        </div>
        <div className="space-y-2.5">
          {flags.map((flag, i) => (
            <RiskCard key={i} flag={flag} />
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {categories.map(([id, score]) => (
          <CategoryScoreBar key={id} categoryId={id} score={score} />
        ))}
      </div>
      <p className="mt-4 text-caption text-muted-foreground">
        {DEMO_ASSESSMENT.flags.length} flags · every one names the exact document
        or answer that caused it, and the exact fix.
      </p>
    </Chrome>
  );
}

/** Agent 9: ranked bank fit, straight from the shipping component. */
export function BankMatchFrame() {
  return (
    // The card carries its own "Bank match" heading, so the chrome names the file.
    <Chrome label={`Kredal — ${DEMO_COMPANY.legal_name}`}>
      <BankMatchCard matches={DEMO_BANK_MATCHES} />
    </Chrome>
  );
}

/**
 * The document checklist.
 *
 * The dashboard's `DocumentCard` pulls in server-only extraction code, so it
 * cannot render here. The checklist logic itself is pure and shared —
 * `requiredDocsFor` is the same function the app uses — so only the row markup
 * is local to marketing.
 */
export function DocumentsFrame() {
  const checklist = requiredDocsFor(DEMO_COMPANY);
  const uploaded = new Set(DEMO_DOCUMENTS.map((d) => d.document_type));

  const rows: { type: DocumentType; required: boolean }[] = [
    ...checklist.required.map((type) => ({ type, required: true })),
    ...checklist.optional.slice(0, 2).map((type) => ({ type, required: false })),
  ];

  return (
    <Chrome label={`Kredal — Documents · ${DEMO_COMPANY.target_bank}`}>
      <ul className="space-y-2">
        {rows.map(({ type, required }) => {
          const have = uploaded.has(type);
          return (
            <li
              key={type}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2.5"
            >
              <span className="flex items-center gap-2.5 text-body-sm">
                <span
                  aria-hidden
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    have
                      ? "bg-risk-low"
                      : required
                        ? "bg-risk-high"
                        : "bg-muted-foreground/40"
                  }`}
                />
                {DOCUMENT_TYPE_LABELS[type]}
              </span>
              <span className="shrink-0 text-caption text-muted-foreground">
                {have ? "On file" : required ? "Required — missing" : "Optional"}
              </span>
            </li>
          );
        })}
      </ul>
      {checklist.bankNote ? (
        <p className="mt-4 text-caption text-muted-foreground">
          {checklist.bankNote}
        </p>
      ) : null}
    </Chrome>
  );
}

/** The generated application pack — the actual markdown from the templates. */
export function PackPreviewFrame() {
  return (
    <Chrome label="Kredal — Bank application pack">
      <div className="max-h-[26rem] overflow-hidden">
        <MarkdownReport content={DEMO_PACK_MARKDOWN} />
      </div>
    </Chrome>
  );
}

/** The consultant's multi-company view. */
export function ConsultantFrame() {
  return (
    <Chrome label="Kredal — Portfolio">
      <CompanyTable companies={DEMO_PORTFOLIO} />
    </Chrome>
  );
}
