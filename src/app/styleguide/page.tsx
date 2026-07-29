import type { Metadata } from "next";
import { AlertOctagon, AlertTriangle, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopySwatch } from "@/components/kredal/copy-swatch";
import {
  KredalLogo,
  LogoMark,
  LogoWordmark,
} from "@/components/kredal/kredal-logo";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Style Guide — Kredal",
  description:
    "Kredal Visual Identity v2: colour tokens, typography, spacing, components, and logo usage.",
};

/* Canonical token values — keep in sync with globals.css / design.md. */
const BRAND_ROW = [
  ["Background / paper", "#f7f7f4"],
  ["Ink / foreground", "#26251e"],
  ["Brand accent", "#f54e00"],
  ["Dark canvas", "#14120b"],
] as const;

const TOKENS = [
  ["card", "#fdfdfc"],
  ["muted", "#f2f1ed"],
  ["card-02", "#ebeae5"],
  ["card-03", "#e6e5e0"],
  ["card-warm", "#f3ede6"],
  ["border", "#e6e5e0"],
  ["ink-02", "#3b3a33"],
  ["muted-foreground", "#6b6a61"],
  ["risk-low", "#1f8a65"],
  ["risk-medium", "#b45309"],
  ["risk-high", "#cf2d56"],
  ["brand", "#f54e00"],
  ["chart-1", "#dfa88f"],
  ["chart-2", "#9fc9a2"],
  ["chart-3", "#9fbbe0"],
  ["chart-4", "#c0a8dd"],
  ["dark / bg", "#14120b"],
  ["dark / card", "#1b1913"],
  ["dark / card-hover", "#201e18"],
  ["dark / foreground", "#edecec"],
] as const;

const TYPE_SPECIMEN = [
  ["display", "2.8rem / 700 / 1.04", "text-display font-bold", "The quick brown fox"],
  ["heading h1", "2rem / 700 / 1.1", "text-h1 font-bold", "The quick brown fox jumps"],
  ["heading h2", "1.5rem / 600 / 1.15", "text-h2 font-semibold", "The quick brown fox jumps over"],
  ["heading h3", "1.125rem / 600 / 1.2", "text-h3 font-semibold", "The quick brown fox jumps over the lazy"],
  ["body", "1rem / 400 / 1.5", "text-body", "The quick brown fox jumps over the lazy dog"],
  ["small / caption", "0.75rem / 400 / 1.35", "text-caption", "The quick brown fox jumps over the lazy dog and sat down."],
] as const;

const SPACING = [
  ["space-1", 4],
  ["space-2", 8],
  ["space-3", 12],
  ["space-4", 16],
  ["space-6", 24],
  ["space-8", 32],
  ["space-12", 48],
  ["space-16", 64],
] as const;

/**
 * The real ladder, derived in globals.css from `--radius: 0.625rem`. These used
 * to be documented as 4/8/16/24, which no token has ever produced — keep this
 * table in step with the `calc()` chain in the `@theme` block.
 */
const RADII = [
  ["radius-none", "0px"],
  ["radius-sm", "6px"],
  ["radius-md", "8px"],
  ["radius-lg", "10px"],
  ["radius-xl", "14px"],
  ["radius-2xl", "18px"],
  ["radius-3xl", "22px"],
  ["radius-full", "9999px"],
] as const;

const SHADOWS = [
  ["Flat", "none"],
  ["XS", "0 1px 2px rgb(20 18 11 / 0.05)"],
  ["SM", "0 2px 6px rgb(20 18 11 / 0.07)"],
  ["MD", "0 6px 16px rgb(20 18 11 / 0.09)"],
  ["LG", "0 12px 28px rgb(20 18 11 / 0.11)"],
  ["XL", "0 24px 48px rgb(20 18 11 / 0.14)"],
] as const;

function Section({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border py-16">
      <h2 className="text-h2 font-semibold">{title}</h2>
      {lead ? (
        <p className="mt-2 max-w-2xl text-body-sm text-muted-foreground">{lead}</p>
      ) : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        <div className="border-b border-border pb-10 pt-16">
          <p className="eyebrow">Visual Identity v2</p>
          <h1 className="mt-3 text-display font-medium">Kredal Style Guide</h1>
          <p className="mt-4 max-w-2xl text-body text-muted-foreground">
            The living reference for Kredal&apos;s design system — warm
            ink/cream tokens, typography, spacing, and components. Source of
            truth: <span className="font-mono text-body-sm">design.md</span>.
          </p>
        </div>

        <Section
          title="Color System"
          lead="Brand palette extracted from the design system. Click any swatch to copy the hex value."
        >
          <div className="grid gap-4 sm:grid-cols-4">
            {BRAND_ROW.map(([name, hex]) => (
              <CopySwatch key={name} name={name} hex={hex} large />
            ))}
          </div>
          <p className="eyebrow mb-4 mt-10">Color tokens</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 lg:grid-cols-10">
            {TOKENS.map(([name, hex]) => (
              <CopySwatch key={name} name={name} hex={hex} />
            ))}
          </div>
        </Section>

        <Section title="Typography Specimen">
          <div className="divide-y divide-border">
            {TYPE_SPECIMEN.map(([name, meta, cls, sample]) => (
              <div
                key={name}
                className="grid gap-2 py-6 sm:grid-cols-[180px_1fr] sm:items-baseline"
              >
                <div>
                  <p className="font-mono text-caption uppercase text-muted-foreground">
                    {name}
                  </p>
                  <p className="font-mono text-caption text-muted-foreground">
                    {meta}
                  </p>
                </div>
                <p className={cls}>{sample}</p>
              </div>
            ))}
            <div className="grid gap-2 py-6 sm:grid-cols-[180px_1fr] sm:items-baseline">
              <p className="font-mono text-caption uppercase text-muted-foreground">
                monospace
              </p>
              <p className="rounded-lg bg-muted px-4 py-3 font-mono text-body-sm">
                const primary = &quot;#26251e&quot;;
              </p>
            </div>
          </div>
        </Section>

        <Section title="Layout & Spacing Tokens">
          <div className="grid gap-12 lg:grid-cols-3">
            <div>
              <p className="eyebrow mb-4">Spacing scale</p>
              <div className="space-y-2.5">
                {SPACING.map(([name, px]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span
                      className="h-3 rounded-sm bg-foreground/80"
                      style={{ width: px }}
                    />
                    <span className="font-mono text-caption">
                      {name} <span className="text-muted-foreground">{px}px</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-4">Border radius</p>
              <div className="space-y-3">
                {RADII.map(([name, r]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span
                      className="h-9 w-9 border-2 border-foreground/70 bg-card"
                      style={{ borderRadius: r }}
                    />
                    <span className="font-mono text-caption">
                      {name} <span className="text-muted-foreground">{r}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-4">Elevation & shadow</p>
              <div className="space-y-3">
                {SHADOWS.map(([name, s]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span
                      className="h-9 w-9 rounded-lg border border-border bg-card"
                      style={{ boxShadow: s }}
                    />
                    <span className="font-mono text-caption">
                      {name}{" "}
                      <span className="text-muted-foreground">
                        shadow-{name.toLowerCase()}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Components"
          lead="Buttons are pills at weight 400–500. Cards use the tint ladder, never shadow-only. Risk colours always pair with an icon and label."
        >
          <div className="space-y-10">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="brand">Brand</Button>
              <Button variant="destructive">Destructive</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-low-bg px-3 py-1 text-caption font-medium text-risk-low-foreground">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} /> Low risk
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-medium-bg px-3 py-1 text-caption font-medium text-risk-medium-foreground">
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} /> Medium risk
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-high-bg px-3 py-1 text-caption font-medium text-risk-high-foreground">
                <AlertOctagon className="h-3.5 w-3.5" strokeWidth={1.5} /> High risk
              </span>
              <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-caption font-medium text-accent-foreground">
                Required
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-caption font-medium text-muted-foreground">
                Optional
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              {[
                ["card", "bg-card"],
                ["muted", "bg-muted"],
                ["card-02", "bg-card-02"],
                ["card-warm", "bg-card-warm"],
              ].map(([name, cls]) => (
                <div key={name} className={`rounded-2xl border border-border p-5 ${cls}`}>
                  <p className="text-body-sm font-medium">Tint ladder</p>
                  <p className="font-mono text-caption text-muted-foreground">{name}</p>
                </div>
              ))}
            </div>

            <div className="grid max-w-md gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sg-input">Company legal name</Label>
                <Input id="sg-input" placeholder="Al Barakah Foods Trading LLC" />
              </div>
              <Button className="w-fit">
                <Upload data-icon="inline-start" className="h-4 w-4" /> Upload document
              </Button>
            </div>
          </div>
        </Section>

        <Section
          title="Logo"
          lead="The K-check monogram: a geometric K whose lower leg resolves into a checkmark — verified, bank-ready. Clearspace of half the mark width; never recolour the mark orange."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-10">
              <LogoMark size={72} />
            </div>
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-10">
              <KredalLogo className="scale-125" />
            </div>
            <div className="dark flex items-center justify-center rounded-2xl bg-background p-10">
              <span className="inline-flex items-center gap-2">
                <LogoMark size={28} className="text-foreground" />
                <LogoWordmark className="text-foreground" />
              </span>
            </div>
          </div>
        </Section>

        <div className="py-16 text-caption text-muted-foreground">
          Tokens live in <span className="font-mono">kredal-app/src/app/globals.css</span> ·
          rules in <span className="font-mono">design.md</span> · questions → Docs.
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
