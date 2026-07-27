import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Clock,
  FileCheck,
  Files,
  Gauge,
  Landmark,
  ScanText,
  ShieldCheck,
  Sparkles,
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

/* ------------------------------------------------------------- why now -- */

const WHY_NOW = [
  {
    icon: Landmark,
    title: "Open Finance went live",
    body: "The UAE's Open Finance framework launched in 2026 — the rails that make a real-time bankability score possible are now here.",
  },
  {
    icon: Clock,
    title: "Compliance is stacking up",
    body: "Corporate tax, e-invoicing, WPS payroll and Emiratisation deadlines in 2026–27 are forcing every SME into structured, auditable financial operations.",
  },
  {
    icon: Building2,
    title: "No software incumbent",
    body: "Bookkeeping tools sit downstream; bank onboarding readiness is still handled by manual consultants. The gate is wide open.",
  },
];

function WhyNow() {
  return (
    <section className="border-b border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="eyebrow">Why now</p>
        <h2 className="mt-3 max-w-2xl text-h1 font-semibold">
          The moment the UAE turns SME banking into infrastructure.
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {WHY_NOW.map((w) => (
            <div key={w.title}>
              <w.icon className="h-5 w-5 text-brand" strokeWidth={1.5} />
              <h3 className="mt-4 text-h3 font-semibold">{w.title}</h3>
              <p className="mt-2 text-body-sm text-muted-foreground">{w.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- traction -- */

const TRACTION: [string, string][] = [
  ["Live", "in production — app, docs and admin, tested end-to-end"],
  ["10", "AI agents shipped, each replacing a manual step"],
  ["31", "end-to-end scenarios in our production test suite"],
  ["Weeks", "from zero to a live product, built with agentic AI"],
];

function Traction() {
  return (
    <section id="traction" className="mx-auto max-w-6xl px-6 py-24">
      <p className="eyebrow">Where we are</p>
      <h2 className="mt-3 max-w-2xl text-h1 font-semibold">
        Not a prototype — a working product you can use today.
      </h2>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRACTION.map(([n, label]) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <p className="text-h1 font-bold tabular-nums">{n}</p>
            <p className="mt-2 text-body-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- team -- */

// Founding team. Fill in real names, roles, one-line bios and LinkedIn URLs,
// then flip SHOW_TEAM to true to render the section publicly.
const SHOW_TEAM = false;
const FOUNDERS = [
  {
    name: "[Founder name]",
    role: "Co-founder — product & engineering",
    bio: "Built the entire Kredal platform — ten AI agents and the deterministic scoring engine — using agentic AI development.",
    linkedin: "#",
  },
  {
    name: "[Co-founder name]",
    role: "Co-founder — growth & partnerships",
    bio: "[One line on background and what they lead — GTM, consultant channel, UAE market.]",
    linkedin: "#",
  },
];

function Team() {
  if (!SHOW_TEAM) return null;
  return (
    <section id="team" className="border-y border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="eyebrow">Founding team</p>
        <h2 className="mt-3 max-w-2xl text-h1 font-semibold">
          Two founders, close to the problem.
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {FOUNDERS.map((f) => (
            <div
              key={f.role}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="h-14 w-14 rounded-full bg-card-02" />
              <h3 className="mt-4 text-h3 font-semibold">{f.name}</h3>
              <p className="text-body-sm font-medium text-brand">{f.role}</p>
              <p className="mt-2 text-body-sm text-muted-foreground">{f.bio}</p>
              <a
                href={f.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-caption font-medium text-foreground hover:underline"
              >
                LinkedIn
                <ArrowRight data-icon="inline-end" className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ mission -- */

function Mission() {
  return (
    <section className="dark bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-brand" strokeWidth={1.5} />
        <h2 className="mt-4 text-balance text-display font-medium">
          Make every UAE SME bankable.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-balance text-body text-muted-foreground">
          UAE small businesses are more than 63% of the non-oil economy but
          receive under 10% of its credit. Kredal exists to close that gap — one
          bank-ready company at a time — starting at the very first gate.
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- page -- */

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  // Auth links sometimes land on the root (e.g. emails sent while the
  // Supabase Site URL pointed elsewhere) — forward the code so the session
  // still completes instead of being silently dropped.
  const { code } = await searchParams;
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/app`);
  }
  return (
    <div className="flex flex-1 flex-col">
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <Stats />
        <WhyNow />
        <Features />
        <AiSection />
        <Traction />
        <Team />
        <Mission />
        <PricingTeaser />
      </main>
      <SiteFooter />
    </div>
  );
}
