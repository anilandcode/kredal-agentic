import Link from "next/link";
import {
  ArrowRight,
  FileCheck,
  Files,
  Gauge,
  ScanText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav, DOCS_URL } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

/* ---------------------------------------------------------------- hero -- */

function HeroProductFrame() {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card p-1.5 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="mx-auto text-caption text-muted-foreground">
          Kredal — Rejection-risk assessment
        </span>
      </div>
      <div className="grid gap-4 rounded-xl bg-background p-5 sm:grid-cols-[auto_1fr]">
        {/* Score gauge */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-8 py-5">
          <svg viewBox="0 0 200 110" className="w-40">
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
          <p className="text-caption text-risk-medium font-medium">Medium risk</p>
        </div>
        {/* Flags */}
        <div className="space-y-2">
          {[
            ["high", "UBO declaration missing for 60% shareholder"],
            ["high", "No source-of-funds evidence on file"],
            ["medium", "Trade license name differs from profile"],
          ].map(([sev, text]) => (
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
    </div>
  );
}

function Hero() {
  return (
    <section className="dark bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-24 text-center sm:pt-28">
        <h1 className="mx-auto max-w-3xl text-balance text-display font-medium">
          Know why a bank would reject your file — before you apply.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-body text-muted-foreground">
          Kredal scores your UAE company&apos;s bank-readiness, flags every
          rejection risk with an exact fix, and assembles a bank-ready
          application pack.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">Start your readiness check</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
              Read the docs
            </a>
          </Button>
        </div>
        <div className="mt-16">
          <HeroProductFrame />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- stats -- */

const STATS: [string, string][] = [
  ["50–65%", "of first-time SME account applications are rejected or delayed"],
  ["$250B", "GCC SME financing gap"],
  ["9.5%", "of UAE commercial credit reaches SMEs — vs 60%+ of non-oil GDP"],
  ["32", "deterministic readiness checks in every assessment"],
];

function Stats() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-px overflow-hidden px-6 py-14 sm:grid-cols-4">
        {STATS.map(([n, label]) => (
          <div key={label} className="px-4 py-3">
            <p className="text-h1 font-bold tabular-nums">{n}</p>
            <p className="mt-1 text-caption text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ features -- */

const FEATURES = [
  {
    icon: Gauge,
    bg: "bg-card-warm",
    title: "A readiness score banks would recognise",
    body: "Seven weighted categories, 32 auditable checks, one deterministic 0–100 score. The same inputs always produce the same verdict.",
  },
  {
    icon: FileCheck,
    bg: "bg-muted",
    title: "Every flag comes with the fix",
    body: "Not “improve your documents” — “upload a UBO declaration naming this 60% shareholder.” Plain language, exact actions.",
  },
  {
    icon: ScanText,
    bg: "bg-card-02",
    title: "AI reads your documents",
    body: "Trade licenses, passports, Emirates IDs and tenancy contracts are extracted server-side and cross-checked against your profile.",
  },
  {
    icon: Files,
    bg: "bg-card-02",
    title: "Bank-specific checklists",
    body: "Wio, Mashreq, Emirates NBD, RAKBANK, ADCB, FAB, ADIB — the document list adapts to the bank you're targeting.",
  },
  {
    icon: ShieldCheck,
    bg: "bg-muted",
    title: "A pack you can walk into the branch with",
    body: "Company summary, source-of-funds narrative, UBO table and preparation checklist — exportable, disclosed, review-ready.",
  },
  {
    icon: Users,
    bg: "bg-card-warm",
    title: "Built for consultants too",
    body: "Multi-client workspaces with roles and invitations. Track every client's readiness from one dashboard.",
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <p className="eyebrow">What Kredal does</p>
      <h2 className="mt-3 max-w-2xl text-h1 font-semibold">
        The pre-application layer between your company and the bank.
      </h2>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={`rounded-2xl border border-border p-6 ${f.bg}`}
          >
            <f.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            <h3 className="mt-4 text-h3 font-semibold">{f.title}</h3>
            <p className="mt-2 text-body-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ AI -- */

function AiSection() {
  return (
    <section className="border-y border-border bg-muted/50">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
        <div>
          <p className="eyebrow">AI, kept honest</p>
          <h2 className="mt-3 text-h1 font-semibold">
            AI does the reading. Deterministic rules give the verdict.
          </h2>
          <p className="mt-4 text-body text-muted-foreground">
            Document extraction and narrative drafting are AI-powered. The
            score never is — every point is a rule you can audit, so the
            assessment is explainable to you, to consultants, and to banks.
          </p>
          <div className="mt-6">
            <Button variant="secondary" asChild>
              <a
                href={`${DOCS_URL}/docs/reference/scoring-engine`}
                target="_blank"
                rel="noopener noreferrer"
              >
                See every scoring rule
                <ArrowRight data-icon="inline-end" className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 font-mono text-caption leading-6">
          <p className="text-muted-foreground"># extraction · trade_license.pdf</p>
          <p>
            legal_name: <span className="text-risk-low">&quot;Al Barakah Foods Trading LLC&quot;</span>
          </p>
          <p>
            expiry_date: <span className="text-risk-low">&quot;2027-03-14&quot;</span> · confidence 0.94
          </p>
          <p className="mt-3 text-muted-foreground"># cross-document checks</p>
          <p>
            <span className="text-risk-low">✓</span> license name matches profile
          </p>
          <p>
            <span className="text-risk-high">✗</span> passport name ≠ any listed owner
            <span className="text-muted-foreground"> → fix suggested</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- pricing -- */

function PricingTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 text-center">
      <p className="eyebrow">Pilot pricing</p>
      <h2 className="mt-3 text-h1 font-semibold">
        A diagnostic costs less than one branch visit.
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-body text-muted-foreground">
        Readiness diagnostic from AED 499 · bank application pack AED 1,999 ·
        consultant workspaces AED 499/month.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/pricing">See pricing</Link>
        </Button>
        <Button size="lg" variant="ghost" asChild>
          <Link href="/security">
            How we protect your documents
            <ArrowRight data-icon="inline-end" className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- page -- */

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Features />
        <AiSection />
        <PricingTeaser />
      </main>
      <SiteFooter />
    </div>
  );
}
