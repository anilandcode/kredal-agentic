import type { Metadata } from "next";
import { LogoMark, LogoWordmark } from "@/components/kredal/kredal-logo";
import { Badged, LOGO_CANDIDATES } from "@/components/kredal/logo-candidates";

export const metadata: Metadata = {
  title: "Icon exploration — Kredal styleguide",
  robots: { index: false, follow: false },
};

const SIZES = [16, 24, 32, 64] as const;

type MarkFn = (p: { size?: number }) => React.ReactElement;

function SizeRow({ render }: { render: (size: number) => React.ReactNode }) {
  return (
    <div className="flex items-end gap-5">
      {SIZES.map((s) => (
        <div key={s} className="flex flex-col items-center gap-1.5">
          {render(s)}
          <span className="text-[11px] text-muted-foreground">{s}px</span>
        </div>
      ))}
    </div>
  );
}

/** Cream and ink side by side — both surfaces the mark has to survive. */
function BothSurfaces({
  render,
}: {
  render: (size: number) => React.ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-background p-5">
        <SizeRow render={render} />
      </div>
      <div className="dark rounded-lg border border-border bg-background p-5 text-foreground">
        <SizeRow render={render} />
      </div>
    </div>
  );
}

export default function LogoExplorationPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow">Styleguide</p>
      <h1 className="mt-3 text-h1 font-semibold">Icon exploration</h1>
      <p className="mt-4 max-w-2xl text-body text-muted-foreground">
        Candidates only. The live mark is unchanged everywhere — header, favicon,
        OG image, deck and docs all still use the K-check below. Adopting one of
        these is a separate change that updates all of them together.
      </p>
      <p className="mt-4 max-w-2xl text-small text-muted-foreground">
        Each candidate is a free-standing filled shape with its counters cut out
        of the geometry — no strokes, no background square. The{" "}
        <strong className="text-foreground">badged</strong> row underneath each
        one is the same path on a filled field, which is what a favicon and an
        app icon need. <strong className="text-foreground">The 16px column
        decides it.</strong>
      </p>

      <section className="mt-14">
        <h2 className="text-h3 font-semibold">Current — K-check</h2>
        <p className="mt-2 max-w-2xl text-small text-muted-foreground">
          Its lower leg resolves into a checkmark, which reads as
          &ldquo;approved&rdquo; — a claim the product deliberately never makes.
        </p>
        <div className="mt-5">
          <BothSurfaces render={(s) => <LogoMark size={s} />} />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <LogoMark size={22} />
          <LogoWordmark />
        </div>
      </section>

      {LOGO_CANDIDATES.map(({ key, name, Mark, d, note }) => {
        const M = Mark as MarkFn;
        return (
          <section key={key} className="mt-16 border-t border-border pt-10">
            <h2 className="text-h3 font-semibold">
              {key} — {name}
            </h2>
            <p className="mt-2 max-w-2xl text-small text-muted-foreground">
              {note}
            </p>

            <p className="mt-6 text-caption font-medium uppercase tracking-widest text-muted-foreground">
              Free-standing
            </p>
            <div className="mt-3">
              <BothSurfaces render={(s) => <M size={s} />} />
            </div>

            <p className="mt-6 text-caption font-medium uppercase tracking-widest text-muted-foreground">
              Badged — favicon / app icon
            </p>
            <div className="mt-3">
              <BothSurfaces render={(s) => <Badged size={s} d={d} />} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-6">
              <span className="inline-flex items-center gap-2.5">
                <M size={24} />
                <LogoWordmark />
              </span>
              <span className="inline-flex items-center gap-2.5">
                <Badged size={22} d={d} />
                <LogoWordmark />
              </span>
            </div>
          </section>
        );
      })}
    </main>
  );
}
