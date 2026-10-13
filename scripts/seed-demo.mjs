#!/usr/bin/env node
// Kredal — demo data seeder for the Hub71 pitch/demo.
//
// Creates a realistic (fictional) UAE SME — company, owners, and a fully
// answered questionnaire with a few deliberate gaps — so the live demo has
// something to run an assessment against immediately. It intentionally does
// NOT pre-generate the assessment or report: running those live is the
// actual product demo.
//
// Usage (after a real Supabase project exists and .env.local is filled in):
//   node --env-file=.env.local scripts/seed-demo.mjs
//
// Safe to re-run — looks up the demo user by email instead of duplicating it.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with: node --env-file=.env.local scripts/seed-demo.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_EMAIL = "demo@kredal.ae";
const DEMO_PASSWORD = "KredalDemo2026!";

/** Builds a tiny, byte-accurate, valid single-page PDF with correct xref offsets. */
function buildPlaceholderPdf(label) {
  const objects = [];
  objects.push("1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj");
  objects.push("2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj");
  objects.push(
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 320 160]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj"
  );
  const text = `BT /F1 14 Tf 20 100 Td (Kredal demo placeholder) Tj 0 -20 Td (${label}) Tj ET`;
  objects.push(`4 0 obj<</Length ${text.length}>>\nstream\n${text}\nendstream\nendobj`);
  objects.push("5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj");

  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj + "\n";
  }
  const xrefStart = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += xref;
  body += `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(body, "latin1");
}

async function getOrCreateDemoUser() {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === DEMO_EMAIL);
  if (found) {
    console.log(`Demo user already exists (${found.id}).`);
    return found;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Demo Founder" },
  });
  if (error) throw error;
  console.log(`Created demo user ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  return data.user;
}

async function main() {
  const user = await getOrCreateDemoUser();

  // Workspace (idempotent-ish: reuse if one already exists for this user)
  const { data: existingWorkspaces } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .limit(1);

  let workspaceId = existingWorkspaces?.[0]?.id;
  if (!workspaceId) {
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .insert({ name: "Demo Workspace", workspace_type: "single_company", owner_user_id: user.id })
      .select("id")
      .single();
    if (error) throw error;
    workspaceId = workspace.id;

    await supabase
      .from("workspace_members")
      .insert({ workspace_id: workspaceId, user_id: user.id, role: "owner" });
    console.log(`Created workspace ${workspaceId}.`);
  } else {
    console.log(`Reusing existing workspace ${workspaceId}.`);
  }

  // Company — deliberately imperfect so the assessment produces a rich,
  // demonstrable set of risk flags rather than a flat 100.
  const incorporationDate = new Date();
  incorporationDate.setMonth(incorporationDate.getMonth() - 5);

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      workspace_id: workspaceId,
      legal_name: "Al Barakah Foods Trading LLC",
      trade_license_number: "DED-778234",
      emirate: "Dubai",
      jurisdiction_type: "mainland",
      authority_name: "Dubai Economic Department (DED)",
      license_activity_codes: ["4630"],
      incorporation_date: incorporationDate.toISOString().slice(0, 10),
      office_status: "Ejari registered — flexi-desk in Deira",
      owner_nationality: "Pakistani",
      owner_uae_residency_status: "UAE resident visa",
      expected_monthly_turnover_aed: 40000,
      target_bank: "Mashreq",
      target_account_type: "Business current account",
      status: "draft",
    })
    .select("id")
    .single();
  if (companyError) throw companyError;
  const companyId = company.id;
  console.log(`Created company ${companyId} — Al Barakah Foods Trading LLC.`);

  await supabase.from("company_owners").insert([
    {
      company_id: companyId,
      full_name: "Anil Founder",
      nationality: "Pakistani",
      ownership_percentage: 60,
      is_ubo: true,
      uae_residency_status: "resident",
      passport_country: "Pakistan",
    },
    {
      company_id: companyId,
      full_name: "Business Partner",
      nationality: "Pakistani",
      ownership_percentage: 40,
      is_ubo: true,
      uae_residency_status: "resident",
      passport_country: "Pakistan",
    },
  ]);

  const answers = {
    business_activity: {
      actual_activity_description:
        "We import packaged food products from Pakistan and distribute them to supermarkets and restaurants across Dubai and Sharjah.",
      activity_matches_license: "yes",
      high_risk_activity: "no",
    },
    expected_transactions: {
      expected_monthly_transaction_count: "100_500",
      average_transaction_size_aed: "2000",
      cash_heavy: "no",
    },
    source_of_funds: {
      // Deliberately left blank — the two highest-value demo flags.
      source_of_funds_explanation: "",
      source_of_funds_evidence_available: "no",
      high_risk_corridor: "no",
    },
    ubo_ownership: {
      ownership_structure_notes:
        "Two co-founders, both Pakistani nationals, no corporate shareholders.",
    },
    counterparties: {
      major_customer_countries: "UAE",
      major_supplier_countries: "Pakistan",
      import_export: "yes",
    },
    tax_status: {
      corporate_tax_status: "not_yet_registered",
      vat_status: "not_yet_registered",
    },
    payroll_wps: {
      has_employees: "yes",
      employee_count: "4",
      wps_status: "unknown",
    },
    banking_history: {
      previously_applied: "yes",
      previously_rejected: "yes",
      rejection_bank_name: "Emirates NBD",
      rejection_reason:
        "They said our business plan was too generic and asked for clearer source-of-funds documentation.",
    },
  };

  const rows = Object.entries(answers).flatMap(([section, qs]) =>
    Object.entries(qs).map(([question_key, value]) => ({
      company_id: companyId,
      section,
      question_key,
      answer_json: value,
    }))
  );
  const { error: qError } = await supabase
    .from("questionnaire_responses")
    .upsert(rows, { onConflict: "company_id,question_key" });
  if (qError) throw qError;
  console.log(`Saved ${rows.length} questionnaire answers across 8 sections.`);

  // Documents — upload 4 of 6 required types. UBO declaration and the
  // tenancy agreement are deliberately left missing for the demo narrative.
  const docsToUpload = [
    { type: "trade_license", filename: "trade_license.pdf" },
    { type: "owner_passport", filename: "owner_passport.pdf" },
    { type: "owner_emirates_id", filename: "owner_emirates_id.pdf" },
    { type: "business_plan", filename: "business_plan.pdf" },
  ];

  for (const doc of docsToUpload) {
    const pdf = buildPlaceholderPdf(doc.type);
    const documentId = crypto.randomUUID();
    const storagePath = `${workspaceId}/${companyId}/${documentId}/${doc.filename}`;

    const { error: uploadError } = await supabase.storage
      .from("company-documents")
      .upload(storagePath, pdf, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw uploadError;

    await supabase.from("documents").insert({
      id: documentId,
      company_id: companyId,
      uploaded_by: user.id,
      document_type: doc.type,
      storage_path: storagePath,
      original_filename: doc.filename,
      mime_type: "application/pdf",
      file_size_bytes: pdf.byteLength,
      status: "uploaded",
    });
  }
  console.log(`Uploaded ${docsToUpload.length} placeholder documents.`);

  console.log("\nDemo ready. Sign in at /login with:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log(`  company:  /app/companies/${companyId}`);
  console.log("\nRun the assessment live from the app — that's the actual demo moment.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
