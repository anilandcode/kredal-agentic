// Generate the specimen documents for every case in
// src/lib/agentic/specimens/cases.json.
//
//   node scripts/specimens/generate.mjs
//
// Each document is HTML printed by headless Chrome — to PDF, or for a "scan",
// screenshotted and degraded with sharp (rotation, blur, JPEG artefacts). Every
// page carries a SPECIMEN banner and watermark; every authority, bank, company
// and person is fictional. Values come straight from each document's `truth`,
// so the ground truth and the printed page cannot disagree.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { cases } = JSON.parse(readFileSync(join(root, "src/lib/agentic/specimens/cases.json"), "utf8"));
const CHROME = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const work = mkdtempSync(join(tmpdir(), "kredal-specimens-"));

// ---------- formatting ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Printed the way real documents print dates, so extraction must normalise. */
const human = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
};
const money = (n) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ---------- page shell ----------

function shell(body, { w = "210mm", h = "297mm", pad = "16mm", wm = 72 } = {}) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: ${w} ${h}; margin: 0 }
  * { box-sizing: border-box }
  body { margin: 0; font-family: "Helvetica Neue", Arial, sans-serif; color: #1d1d1b; -webkit-print-color-adjust: exact; print-color-adjust: exact }
  .page { position: relative; width: ${w}; height: ${h}; padding: ${pad}; overflow: hidden; background: #fff }
  .banner { margin: calc(-1 * ${pad}) calc(-1 * ${pad}) 10mm; background: #b3202a; color: #fff; font-size: 9px; letter-spacing: 2.5px; text-align: center; padding: 5px 0; font-weight: 600 }
  .wm { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none }
  .wm span { transform: rotate(-28deg); font-size: ${wm}px; font-weight: 800; letter-spacing: 8px; color: rgba(179, 32, 42, .11); white-space: nowrap }
  h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: .5px }
  h2 { font-size: 13px; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: 1.5px; color: #555 }
  .muted { color: #666; font-size: 11px }
  table { width: 100%; border-collapse: collapse; font-size: 12px }
  td, th { padding: 6px 8px; border-bottom: 1px solid #e3e1da; text-align: left; vertical-align: top }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; font-weight: 600 }
  td.k { width: 34%; color: #555 }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums }
  .seal { position: absolute; right: 18mm; bottom: 22mm; width: 34mm; height: 34mm; border: 2px dashed #b3202a; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; color: #b3202a; font-weight: 700; letter-spacing: 1px }
  </style></head><body><div class="page">
  <div class="banner">SPECIMEN — NOT A REAL DOCUMENT — GENERATED FOR SOFTWARE TESTING</div>
  ${body}
  <div class="wm"><span>SPECIMEN</span></div></div></body></html>`;
}

// ---------- templates, one per document type ----------

const T = {
  trade_license: (c, t) =>
    shell(`
    <div class="muted">${esc(t.authority)}</div>
    <h1>${c.company.jurisdiction_type === "free_zone" ? "Free Zone Company Licence" : "Commercial Licence"}</h1>
    <div class="muted">This specimen licence has no legal effect.</div>
    <h2>Licence details</h2>
    <table>
      <tr><td class="k">Licence No.</td><td>${esc(t.license_number)}</td></tr>
      <tr><td class="k">Company name</td><td><b>${esc(t.legal_name)}</b></td></tr>
      <tr><td class="k">Legal form</td><td>${c.company.jurisdiction_type === "free_zone" ? "Free Zone Establishment" : "Limited Liability Company"}</td></tr>
      <tr><td class="k">Emirate</td><td>${esc(c.company.emirate)}</td></tr>
      <tr><td class="k">Issue date</td><td>${human(t.issue_date)}</td></tr>
      <tr><td class="k">Expiry date</td><td>${human(t.expiry_date)}</td></tr>
    </table>
    <h2>Licensed activities</h2>
    <table><tr><th>Code</th><th>Activity</th></tr>
      ${t.activity_codes.split("; ").map((code, i) => `<tr><td>${esc(code)}</td><td>${esc(t.activity_descriptions.split("; ")[i] ?? t.activity_descriptions)}</td></tr>`).join("")}
      ${t.activity_descriptions.split("; ").slice(t.activity_codes.split("; ").length).map((a) => `<tr><td></td><td>${esc(a)}</td></tr>`).join("")}
    </table>
    <h2>Manager</h2>
    <table><tr><td class="k">Name</td><td>${esc(c.owners[0].full_name)}</td></tr>
      <tr><td class="k">Nationality</td><td>${esc(c.owners[0].nationality)}</td></tr></table>
    <div class="seal">SPECIMEN<br>AUTHORITY<br>SEAL</div>`),

  owner_passport: (c, t) => {
    const [surname, ...given] = t.full_name.split(" ");
    const mrzName = `${surname}<<${given.join("<")}`.padEnd(39, "<");
    const code = t.nationality.slice(0, 3);
    return shell(
      `
      <div style="display:flex;gap:7mm">
        <div style="width:30mm;height:38mm;background:linear-gradient(#d9d6cd,#bcb8ad);border-radius:2mm;display:flex;align-items:flex-end;justify-content:center;overflow:hidden">
          <div style="width:20mm;height:26mm;background:#9d998e;border-radius:10mm 10mm 0 0"></div></div>
        <div style="flex:1;font-size:10.5px;line-height:1.35">
          <div style="font-size:12px;font-weight:700;letter-spacing:1.5px">PASSPORT — SPECIMEN</div>
          <div class="muted" style="font-size:9px">Type P · Country ${esc(code)} · No. <b>${esc(t.passport_number)}</b></div>
          <div style="margin-top:2mm"><span class="muted">Surname</span><br><b>${esc(surname)}</b></div>
          <div><span class="muted">Given names</span><br><b>${esc(given.join(" "))}</b></div>
          <div style="display:flex;gap:6mm;margin-top:1mm">
            <div><span class="muted">Nationality</span><br>${esc(t.nationality)}</div>
            <div><span class="muted">Date of birth</span><br>${human(t.date_of_birth)}</div></div>
          <div style="display:flex;gap:6mm;margin-top:1mm">
            <div><span class="muted">Date of issue</span><br>${human(String(Number(t.expiry_date.slice(0, 4)) - 10) + t.expiry_date.slice(4))}</div>
            <div><span class="muted">Date of expiry</span><br><b>${human(t.expiry_date)}</b></div></div>
        </div>
      </div>
      <div style="position:absolute;left:8mm;right:8mm;bottom:7mm;font-family:'Courier New',monospace;font-size:12.5px;letter-spacing:1.2px">
        P&lt;${esc(code)}${esc(mrzName)}<br>${esc(t.passport_number)}&lt;0${esc(code)}${t.date_of_birth.replace(/-/g, "").slice(2)}0M${t.expiry_date.replace(/-/g, "").slice(2)}0&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
      </div>`,
      { w: "125mm", h: "88mm", pad: "8mm", wm: 46 }
    );
  },

  owner_emirates_id: (c, t) =>
    shell(
      `
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px">IDENTITY CARD — SPECIMEN</div>
      <div class="muted" style="font-size:9px">Specimen identity authority · Not valid for any purpose</div>
      <div style="display:flex;gap:6mm;margin-top:4mm">
        <div style="width:24mm;height:30mm;background:linear-gradient(#d9d6cd,#bcb8ad);border-radius:2mm"></div>
        <div style="font-size:11px;line-height:1.5">
          <div><span class="muted">ID Number</span><br><b>784-1988-000${t.id_last4.slice(0, 3)}${t.id_last4.slice(3)}-${t.id_last4.slice(3)}</b></div>
          <div><span class="muted">Name</span><br><b>${esc(t.full_name)}</b></div>
          <div><span class="muted">Expiry date</span><br>${human(t.expiry_date)}</div>
        </div></div>`,
      { w: "125mm", h: "80mm", pad: "8mm", wm: 46 }
    ),

  tenancy_or_office_agreement: (c, t) =>
    shell(`
    <div class="muted">Specimen Properties LLC · Leasing Department</div>
    <h1>${c.company.office_status?.toLowerCase().includes("flexi") ? "Flexi-Desk Licence Agreement" : "Tenancy Contract"}</h1>
    <div class="muted">Specimen registration no. TC-${esc(c.company.trade_license_number.slice(-6))}</div>
    <h2>Parties</h2>
    <table>
      <tr><td class="k">Landlord</td><td>Specimen Properties LLC</td></tr>
      <tr><td class="k">Tenant</td><td><b>${esc(t.tenant_name)}</b></td></tr>
    </table>
    <h2>Premises and term</h2>
    <table>
      <tr><td class="k">Premises</td><td>${esc(t.premises_address)}</td></tr>
      <tr><td class="k">Contract start</td><td>${human(String(Number(t.expiry_date.slice(0, 4)) - 1) + "-" + t.expiry_date.slice(5, 7) + "-" + String(Math.min(28, Number(t.expiry_date.slice(8)) + 1)).padStart(2, "0"))}</td></tr>
      <tr><td class="k">Contract end</td><td><b>${human(t.expiry_date)}</b></td></tr>
      <tr><td class="k">Annual rent</td><td>AED ${money(c.company.office_status?.toLowerCase().includes("flexi") ? 14500 : 168000)}</td></tr>
    </table>
    <div class="seal">SPECIMEN<br>LANDLORD<br>STAMP</div>`),

  bank_statement: (c, t) => {
    // Spread the stated totals over a month of transactions that add up exactly.
    const credits = split(Number(t.total_credits), 5);
    const debits = split(Number(t.total_debits), 6);
    const rows = [];
    let bal = Number(t.opening_balance);
    const days = [2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25, 28];
    const merged = [];
    credits.forEach((a, i) => merged.push({ day: days[i * 2], cr: a, desc: ["Customer receipt — invoice", "Transfer in — customer", "Cheque deposit", "Customer receipt — invoice", "Transfer in — customer"][i] }));
    debits.forEach((a, i) => merged.push({ day: days[i * 2 + 1] ?? 29, dr: a, desc: ["Supplier payment", "Salaries", "Rent", "Supplier payment", "Utilities", "Card settlement"][i] }));
    merged.sort((a, b) => a.day - b.day);
    for (const m of merged) {
      bal = Math.round((bal + (m.cr ?? 0) - (m.dr ?? 0)) * 100) / 100;
      rows.push(`<tr><td>${String(m.day).padStart(2, "0")} ${MONTHS[Number(t.period_start.slice(5, 7)) - 1]}</td><td>${m.desc}</td><td class="n">${m.dr ? money(m.dr) : ""}</td><td class="n">${m.cr ? money(m.cr) : ""}</td><td class="n">${money(bal)}</td></tr>`);
    }
    if (Math.abs(bal - Number(t.closing_balance)) > 0.005) throw new Error(`statement for ${t.account_holder} does not balance: ${bal} vs ${t.closing_balance}`);
    return shell(`
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><h1>${esc(t.bank_name)}</h1><div class="muted">Fictional bank · specimen statement</div></div>
      <div class="muted" style="text-align:right">Account statement<br>${human(t.period_start)} – ${human(t.period_end)}</div></div>
    <h2>Account</h2>
    <table>
      <tr><td class="k">Account holder</td><td><b>${esc(t.account_holder)}</b></td></tr>
      <tr><td class="k">IBAN</td><td>AE00 SPEC 0000 0000 0000 ${esc(c.company.trade_license_number.slice(-3))}</td></tr>
      <tr><td class="k">Currency</td><td>${esc(t.currency)}</td></tr>
    </table>
    <h2>Summary</h2>
    <table>
      <tr><td class="k">Opening balance</td><td class="n">${money(t.opening_balance)}</td></tr>
      <tr><td class="k">Total credits</td><td class="n">${money(t.total_credits)}</td></tr>
      <tr><td class="k">Total debits</td><td class="n">${money(t.total_debits)}</td></tr>
      <tr><td class="k"><b>Closing balance</b></td><td class="n"><b>${money(t.closing_balance)}</b></td></tr>
    </table>
    <h2>Transactions</h2>
    <table><tr><th>Date</th><th>Description</th><th class="n">Debit</th><th class="n">Credit</th><th class="n">Balance</th></tr>${rows.join("")}</table>`);
  },

  ubo_declaration: (c) =>
    shell(`
    <h1>Declaration of Ultimate Beneficial Ownership</h1>
    <div class="muted">${esc(c.company.legal_name)} · Licence ${esc(c.company.trade_license_number)}</div>
    <h2>Beneficial owners</h2>
    <table><tr><th>Name</th><th>Nationality</th><th class="n">Ownership</th></tr>
      ${c.owners.map((o) => `<tr><td>${esc(o.full_name)}</td><td>${esc(o.nationality)}</td><td class="n">${o.ownership_percentage}%</td></tr>`).join("")}</table>
    <p style="font-size:12px;margin-top:10mm">I declare that the information above is true and complete.</p>
    <p style="font-size:12px;margin-top:16mm">Signed: ______________________ &nbsp; ${esc(c.owners[0].full_name)}</p>`),

  business_plan: (c) =>
    shell(`
    <h1>Company Profile &amp; Business Plan</h1>
    <div class="muted">${esc(c.company.legal_name)}</div>
    <h2>What we do</h2><p style="font-size:12.5px;line-height:1.55">${esc(c.answers.actual_activity_description)}</p>
    <h2>Customers and suppliers</h2>
    <table><tr><td class="k">Customer countries</td><td>${esc(c.answers.major_customer_countries)}</td></tr>
      <tr><td class="k">Supplier countries</td><td>${esc(c.answers.major_supplier_countries)}</td></tr>
      <tr><td class="k">Expected monthly turnover</td><td>AED ${money(c.company.expected_monthly_turnover_aed)}</td></tr>
      <tr><td class="k">Employees</td><td>${esc(c.answers.employee_count ?? "—")}</td></tr></table>`),

  invoice_or_contract: (c) =>
    shell(`
    <h1>Supply Agreement</h1>
    <div class="muted">Specimen agreement no. SA-2026-0412</div>
    <h2>Parties</h2>
    <table><tr><td class="k">Supplier</td><td><b>${esc(c.company.legal_name)}</b></td></tr>
      <tr><td class="k">Buyer</td><td>Specimen Hypermarkets LLC</td></tr></table>
    <h2>Terms</h2>
    <table><tr><td class="k">Goods</td><td>Dried fruit, nuts and spices, per monthly purchase orders</td></tr>
      <tr><td class="k">Estimated annual value</td><td>AED ${money(1200000)}</td></tr>
      <tr><td class="k">Payment terms</td><td>30 days from invoice</td></tr>
      <tr><td class="k">Term</td><td>01 Jan 2026 – 31 Dec 2027</td></tr></table>
    <div class="seal">SPECIMEN<br>SIGNED<br>COPY</div>`),
};

/** Split a total into n uneven parts that sum exactly (cents-safe). */
function split(total, n) {
  const weights = [0.31, 0.12, 0.22, 0.09, 0.17, 0.09].slice(0, n);
  const sum = weights.reduce((a, b) => a + b, 0);
  const cents = Math.round(total * 100);
  const parts = weights.map((w) => Math.floor((cents * w) / sum));
  parts[0] += cents - parts.reduce((a, b) => a + b, 0);
  return parts.map((p) => p / 100);
}

// ---------- rendering ----------

let launches = 0;
function chrome(args) {
  // A private profile per launch: without it headless Chrome shares the user's
  // real profile and intermittently fails on its lock while Chrome is open.
  const profile = join(work, `profile-${launches++}`);
  const r = spawnSync(
    CHROME,
    ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", `--user-data-dir=${profile}`, ...args],
    { encoding: "utf8" }
  );
  if (r.status !== 0) throw new Error(`chrome failed: ${r.stderr?.slice(0, 300)}`);
}

async function render(c, doc, outDir) {
  const html = T[doc.type](c, doc.truth);
  const htmlPath = join(work, `${c.id}-${doc.id}.html`);
  writeFileSync(htmlPath, html);
  const out = join(outDir, doc.file);

  if (doc.render === "pdf") {
    chrome(["--no-pdf-header-footer", "--virtual-time-budget=3000", `--print-to-pdf=${out}`, `file://${htmlPath}`]);
    return out;
  }

  // "scan": a phone photo of the page — slightly rotated, soft, compressed.
  // The viewport must match the page exactly or the document lands in one
  // corner of a mostly blank image.
  const [, wmm, hmm] = html.match(/size: ([\d.]+)mm ([\d.]+)mm/);
  const px = (mm) => Math.round((Number(mm) * 96) / 25.4);
  const png = join(work, `${c.id}-${doc.id}.png`);
  chrome([
    `--window-size=${px(wmm)},${px(hmm)}`,
    "--force-device-scale-factor=2.5",
    "--virtual-time-budget=3000",
    `--screenshot=${png}`,
    `file://${htmlPath}`,
  ]);
  await sharp(png)
    .rotate(1.6, { background: "#f2efe8" })
    .blur(1.15)
    .modulate({ brightness: 0.94, saturation: 0.85 })
    .jpeg({ quality: 46 })
    .toFile(out);
  return out;
}

let count = 0;
for (const c of cases) {
  const outDir = join(root, "public/specimens", c.id);
  mkdirSync(outDir, { recursive: true });
  for (const doc of c.documents) {
    if (!T[doc.type]) throw new Error(`no template for ${doc.type}`);
    const out = await render(c, doc, outDir);
    count++;
    console.log(`  ${c.id}/${doc.file}`);
    void out;
  }
}
rmSync(work, { recursive: true, force: true });
console.log(`${count} specimen documents written to public/specimens/`);
