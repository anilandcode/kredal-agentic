import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Clock,
  Landmark,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav, DOCS_URL } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { FounderAvatar } from "@/components/marketing/founder-avatar";
import {
  AssessmentFrame,
  ConsultantFrame,
  ExtractionFrame,
  PackPreviewFrame,
} from "@/components/marketing/product-frames";

/* ----------------------------------------------------------- art stage -- */

/**
 * The painted stage: a generated wash (design.md § 3.7) framing a product
 * visual, with the painting left visible as a margin around it. Only the image
 * area is painted — copy always sits on flat background, so contrast is never
 * at the mercy of the art.
 */
function ArtStage({
  art,
  children,
  className = "",
}: {
  /** Basename in /backgrounds — resolves the -light/-dark pair. */
  art: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl ${className}`}>
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center dark:hidden"
        style={{ backgroundImage: `url(/backgrounds/${art}-light.webp)` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-cover bg-center dark:block"
        style={{ backgroundImage: `url(/backgrounds/${art}-dark.webp)` }}
      />
      {/* The painted margin: padding here is what makes the art read as a frame. */}
      <div className="relative p-5 sm:p-8 lg:p-12">
        <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/30 ring-1 ring-black/10">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- hero -- */

function Hero() {
  return (
    <section className="dark bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-24 text-center sm:pt-28">
        <h1 className="mx-auto max-w-3xl text-balance text-display font-medium">
          Know why a bank would reject your file — before you apply.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-body text-muted-foreground">
          Kredal scores your UAE company&apos;s bank-readiness, flags every
          rejection risk with an exact fix, and assembles a bank-ready
          application pack.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">Start your readiness check</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
              Read the docs
            </a>
          </Button>
        </div>
        <div className="mx-auto mt-16 max-w-5xl text-left">
          <ArtStage art="hero">
            <AssessmentFrame />
          </ArtStage>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ bank row -- */

const BANKS = [
  "Wio Bank",
  "Mashreq",
  "Emirates NBD",
  "RAKBANK",
  "ADCB",
  "FAB",
  "ADIB",
];

function BankRow() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-14 text-center">
        <p className="text-caption font-medium uppercase tracking-widest text-muted-foreground">
          Checklists tuned for
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {BANKS.map((b) => (
            <span key={b} className="text-h3 font-semibold text-foreground/70">
              {b}
            </span>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-caption text-muted-foreground">
          Bank names indicate supported document checklists. Kredal is
          independent and not affiliated with, endorsed by, or partnered with
          these banks.
        </p>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- showcases -- */

function Showcase({
  id,
  eyebrow,
  title,
  body,
  linkHref,
  linkLabel,
  external,
  frame,
  reverse,
  art,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  body: string;
  linkHref: string;
  linkLabel: string;
  external?: boolean;
  frame: React.ReactNode;
  reverse?: boolean;
  /** Basename in /backgrounds — the -light/-dark pair of painterly washes. */
  art: string;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-6 py-8 first:pt-16">
      <div className="rounded-3xl border border-border bg-muted p-6 sm:p-8">
        {/* Copy always sits on flat panel background — never on the art. The
            stage below spans the full panel so the product UI keeps its real
            proportions instead of cramming into a half-width column. */}
        <div className={`max-w-2xl ${reverse ? "ml-auto text-right" : ""}`}>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-3 text-h1 font-semibold">{title}</h2>
          <p className="mt-4 text-body text-muted-foreground">{body}</p>
          <div className="mt-6">
            {external ? (
              <Button variant="secondary" asChild>
                <a href={linkHref} target="_blank" rel="noopener noreferrer">
                  {linkLabel}
                  <ArrowRight data-icon="inline-end" className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button variant="secondary" asChild>
                <Link href={linkHref}>
                  {linkLabel}
                  <ArrowRight data-icon="inline-end" className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
        {/* The image area: painted stage with the product visual inset. */}
        <ArtStage art={art} className="mt-10">
          {frame}
        </ArtStage>
      </div>
    </section>
  );
}

function Showcases() {
  return (
    <>
      <Showcase
        id="features"
        eyebrow="See the risk first"
        title="The rejection reasons, before the bank finds them."
        body="Seven weighted categories, 32 auditable checks, one deterministic 0–100 score. Every flag names the exact document or answer that caused it — and the exact fix."
        linkHref="/signup"
        linkLabel="Run a readiness check"
        frame={<AssessmentFrame />}
        art="panel-1"
      />
      <Showcase
        eyebrow="AI, kept honest"
        title="AI reads your documents. Rules give the verdict."
        body="Trade licenses, passports, Emirates IDs and tenancy contracts are extracted server-side, then cross-checked against each other and your profile. The score itself is never guessed — every point is a rule you can audit."
        linkHref={`${DOCS_URL}/docs/reference/scoring-engine`}
        linkLabel="See every scoring rule"
        external
        frame={<ExtractionFrame />}
        reverse
        art="panel-2"
      />
      <Showcase
        eyebrow="The output"
        title="A pack you can walk into the branch with."
        body="Company summary, source-of-funds narrative, UBO table and a bank-specific preparation checklist — assembled, disclosed and exportable, tuned to the bank you're targeting."
        linkHref="/pricing"
        linkLabel="See what's included"
        frame={<PackPreviewFrame />}
        art="panel-3"
      />
      <Showcase
        eyebrow="For consultants"
        title="Every client's readiness, in one workspace."
        body="Business-setup consultants and accountants run multiple client companies side by side, with roles, invitations and white-label reports — and see at a glance who is ready to apply."
        linkHref="/pricing"
        linkLabel="Consultant workspaces"
        frame={<ConsultantFrame />}
        reverse
        art="panel-4"
      />
    </>
  );
}

/* --------------------------------------------------------- agents band -- */

const AGENTS: [string, string][] = [
  ["Document extraction", "Reads licences, IDs and contracts into structured facts"],
  ["Consistency checking", "Cross-checks names, activity and expiry across documents"],
  ["Deterministic scoring", "32 rules, 7 categories, one explainable score"],
  ["Risk flags & fixes", "Every deduction becomes a concrete next action"],
  ["Source-of-funds drafter", "Writes the narrative banks ask for"],
  ["Pack assembler", "Builds the full submission set for your bank"],
  ["Docs assistant", "Answers “why does the bank need this?” instantly"],
  ["Recovery advisor", "Turns a rejection reason into a targeted plan"],
  ["Bank matcher", "Ranks which banks fit this file best"],
  ["Compliance monitor", "Watches expiries and 2026 tax, VAT and WPS dates"],
];

function AgentsBand() {
  return (
    <section id="agents" className="border-y border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-3 max-w-2xl text-h1 font-semibold">
          Ten agents. One file.
        </h2>
        <p className="mt-4 max-w-2xl text-body text-muted-foreground">
          Each one replaces a step a consultant or bank officer does by hand
          today.
        </p>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
          {AGENTS.map(([title, body], i) => (
            <div key={title} className="bg-background p-5">
              <span className="text-caption font-medium tabular-nums text-brand">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-body-sm font-semibold">{title}</h3>
              <p className="mt-1 text-caption text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------- built in the open -- */

const OPEN_PROOF = [
  {
    stat: "32",
    title: "Scoring rules, published",
    body: "Every rule that can cost you points is documented in public — including its weight and the fix it recommends.",
    href: `${DOCS_URL}/docs/reference/scoring-engine`,
    cta: "Read the rules",
  },
  {
    stat: "12",
    title: "Architecture decisions on record",
    body: "Why AI never decides the score, how tenant isolation works, how admin access is granted — written down, not asserted.",
    href: `${DOCS_URL}/docs/adr/0009-ai-advisory-deterministic-score`,
    cta: "Read the decisions",
  },
  {
    stat: "31",
    title: "End-to-end scenarios tested",
    body: "The full flow — signup, documents, questionnaire, scoring, reports, tenant isolation — verified against production.",
    href: DOCS_URL,
    cta: "Browse the docs",
  },
];

function BuiltInTheOpen() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <p className="eyebrow">Built in the open</p>
      <h2 className="mt-3 max-w-2xl text-h1 font-semibold">
        Judge the engine, not the marketing.
      </h2>
      <p className="mt-4 max-w-2xl text-body text-muted-foreground">
        A readiness score is only worth something if you can see how it was
        calculated. Ours is public.
      </p>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {OPEN_PROOF.map((c) => (
          <div
            key={c.title}
            className="flex flex-col rounded-2xl border border-border bg-card p-6"
          >
            <p className="text-h1 font-bold tabular-nums text-brand">{c.stat}</p>
            <h3 className="mt-3 text-h3 font-semibold">{c.title}</h3>
            <p className="mt-2 flex-1 text-body-sm text-muted-foreground">
              {c.body}
            </p>
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-body-sm font-medium hover:underline"
            >
              {c.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        ))}
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
    <section className="border-y border-border bg-muted/50">
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

/* ------------------------------------------------------------ traction -- */

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

/* ---------------------------------------------------------------- team -- */

const FOUNDERS = [
  {
    name: "Anil Pervaiz",
    initials: "AP",
    photo: "/team/anil.jpg",
    role: "Co-founder & CEO — Product & AI Engineering",
    bio: "AI agents & automation engineer with a decade of design and Webflow craft; built Saaspo, one of the most-visited SaaS design galleries. Built Kredal's ten agents, RAG, and deterministic scoring engine.",
    linkedin: "https://www.linkedin.com/in/anilpervaiz/",
    site: "anilpervaiz.com",
  },
  {
    name: "Zainab Ahmad",
    initials: "ZA",
    photo: "/team/zainab.jpg",
    role: "Co-founder — Design & Brand",
    bio: "Designer leading Kredal's product design, brand, and user experience — turning a compliance-heavy process into something a founder can actually follow.",
    linkedin: "https://www.linkedin.com/in/zainab-ahmad",
    site: "designwithzainab.com",
  },
];

function Team() {
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
              key={f.name}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <FounderAvatar src={f.photo} alt={f.name} initials={f.initials} />
              <h3 className="mt-4 text-h3 font-semibold">{f.name}</h3>
              <p className="text-body-sm font-medium text-brand">{f.role}</p>
              <p className="mt-2 text-body-sm text-muted-foreground">{f.bio}</p>
              <div className="mt-3 flex items-center gap-4 text-caption font-medium">
                <a
                  href={f.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-foreground hover:underline"
                >
                  LinkedIn
                  <ArrowRight data-icon="inline-end" className="h-3.5 w-3.5" />
                </a>
                <a
                  href={`https://${f.site}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:underline"
                >
                  {f.site}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- mission -- */

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
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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

/* --------------------------------------------------------- closing CTA -- */

function ClosingCTA() {
  return (
    <section className="dark bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-28 text-center">
        <h2 className="text-balance text-display font-medium">
          Know your score before the bank does.
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-balance text-body text-muted-foreground">
          Upload your documents, answer the questionnaire, and see exactly what
          stands between your company and an open account.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">Start your readiness check</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
              Read the docs
            </a>
          </Button>
        </div>
        <p className="mt-8 text-caption text-muted-foreground">
          Kredal is not a bank, lender, law firm, auditor or tax advisor, and
          does not guarantee bank approval.
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
        <BankRow />
        <Showcases />
        <AgentsBand />
        <BuiltInTheOpen />
        <WhyNow />
        <Traction />
        <Team />
        <Mission />
        <PricingTeaser />
        <ClosingCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
