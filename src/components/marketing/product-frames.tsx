/**
 * Product visuals for the marketing page. Each frame is a CSS/SVG composition
 * in window chrome — theme-aware, no image assets, no client JS. Risk colours
 * appear only where they encode risk (ADR 0005).
 */

function Chrome({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full rounded-2xl border border-border bg-card p-1.5 shadow-2xl shadow-black/20">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="mx-auto truncate text-caption text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="rounded-xl bg-background p-5">{children}</div>
    </div>
  );
}

const FLAGS: [string, string][] = [
  ["high", "UBO declaration missing for 60% shareholder"],
  ["high", "No source-of-funds evidence on file"],
  ["medium", "Trade license name differs from profile"],
];

export function AssessmentFrame() {
  return (
    <Chrome label="Kredal — Rejection-risk assessment">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-8 py-5">
          <svg viewBox="0 0 200 110" className="w-40" aria-hidden>
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="var(--border)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="var(--risk-medium)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={Math.PI * 80}
              strokeDashoffset={Math.PI * 80 * (1 - 0.62)}
            />
          </svg>
          <p className="-mt-6 text-h1 font-bold tabular-nums">62</p>
          <p className="text-caption font-medium text-risk-medium">Medium risk</p>
        </div>
        <div className="space-y-2">
          {FLAGS.map(([sev, text]) => (
            <div
              key={text}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2.5"
            >
              <span
                className={
                  sev === "high"
                    ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-risk-high"
                    : "mt-1 h-2 w-2 shrink-0 rounded-full bg-risk-medium"
                }
              />
              <div>
                <p className="text-body-sm text-foreground">{text}</p>
                <p className="text-caption text-muted-foreground">
                  Fix provided · 2 min
                </p>
              </div>
            </div>
          ))}
          <p className="pt-1 text-caption text-muted-foreground">
            32 deterministic checks · every flag maps to an exact fix
          </p>
        </div>
      </div>
    </Chrome>
  );
}

export function ExtractionFrame() {
  return (
    <Chrome label="Kredal — Document extraction">
      <div className="font-mono text-caption leading-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-muted-foreground"># trade_license.pdf</p>
          <span className="rounded-full bg-risk-low-bg px-2 py-0.5 text-risk-low-foreground">
            confidence 0.94
          </span>
        </div>
        <p>
          legal_name:{" "}
          <span className="text-risk-low">&quot;Al Barakah Foods Trading LLC&quot;</span>
        </p>
        <p>
          license_no: <span className="text-risk-low">&quot;CN-1043877&quot;</span>
        </p>
        <p>
          expiry_date: <span className="text-risk-low">&quot;2027-03-14&quot;</span>
        </p>
        <p className="mt-4 text-muted-foreground"># cross-document checks</p>
        <p>
          <span className="text-risk-low">✓</span> license name matches profile
        </p>
        <p>
          <span className="text-risk-low">✓</span> activity code within licensed scope
        </p>
        <p>
          <span className="text-risk-high">✗</span> passport name ≠ any listed owner
          <span className="text-muted-foreground"> → fix suggested</span>
        </p>
      </div>
    </Chrome>
  );
}

const PACK_DOCS: [string, boolean][] = [
  ["Trade license", true],
  ["UBO declaration", true],
  ["Owner passport", true],
  ["Emirates ID", true],
  ["Tenancy contract", true],
  ["Bank statement", false],
];

export function PackPreviewFrame() {
  return (
    <Chrome label="Kredal — Bank application pack">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="mb-2 text-caption font-medium text-muted-foreground">
            Document checklist · Mashreq
          </p>
          {PACK_DOCS.map(([doc, done]) => (
            <div
              key={doc}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2"
            >
              <span
                className={
                  done
                    ? "text-body-sm text-risk-low"
                    : "text-body-sm text-muted-foreground"
                }
              >
                {done ? "✓" : "—"}
              </span>
              <span className="text-body-sm">{doc}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-caption font-medium text-muted-foreground">
            Source-of-funds narrative
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-muted" />
            <div className="h-2 w-11/12 rounded-full bg-muted" />
            <div className="h-2 w-full rounded-full bg-muted" />
            <div className="h-2 w-4/5 rounded-full bg-muted" />
          </div>
          <p className="mt-4 text-caption font-medium text-muted-foreground">
            UBO summary
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 w-3/4 rounded-full bg-muted" />
            <div className="h-2 w-2/3 rounded-full bg-muted" />
          </div>
          <p className="mt-4 text-caption text-muted-foreground">
            Exportable · disclosure included
          </p>
        </div>
      </div>
    </Chrome>
  );
}

const CLIENTS: [string, string, string, string][] = [
  ["Al Barakah Foods", "Mashreq", "88", "low"],
  ["Gulf Line Logistics", "Wio Bank", "62", "medium"],
  ["Noor Textiles FZE", "ADCB", "41", "high"],
  ["Sadaf Trading LLC", "RAKBANK", "79", "medium"],
];

export function ConsultantFrame() {
  return (
    <Chrome label="Kredal — Client portfolio">
      <div className="space-y-1.5">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 pb-1 text-caption text-muted-foreground">
          <span>Client</span>
          <span>Target bank</span>
          <span>Score</span>
        </div>
        {CLIENTS.map(([name, bank, score, risk]) => (
          <div
            key={name}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
          >
            <span className="truncate text-body-sm font-medium">{name}</span>
            <span className="text-caption text-muted-foreground">{bank}</span>
            <span
              className={
                risk === "low"
                  ? "rounded-full bg-risk-low-bg px-2 py-0.5 text-caption font-medium tabular-nums text-risk-low-foreground"
                  : risk === "medium"
                    ? "rounded-full bg-risk-medium-bg px-2 py-0.5 text-caption font-medium tabular-nums text-risk-medium-foreground"
                    : "rounded-full bg-risk-high-bg px-2 py-0.5 text-caption font-medium tabular-nums text-risk-high-foreground"
              }
            >
              {score}
            </span>
          </div>
        ))}
        <p className="pt-2 text-caption text-muted-foreground">
          One workspace · roles and invitations · white-label reports
        </p>
      </div>
    </Chrome>
  );
}
