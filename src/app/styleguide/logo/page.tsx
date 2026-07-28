import type { Metadata } from "next";
import { LogoMark, LogoWordmark } from "@/components/kredal/kredal-logo";
import { LOGO_CANDIDATES } from "@/components/kredal/logo-candidates";

export const metadata: Metadata = {
  title: "Logo exploration — Kredal styleguide",
  robots: { index: false, follow: false },
};

const SIZES = [16, 32, 64] as const;

/** One mark rendered at every size, on one surface. */
function SizeRow({
  Mark,
}: {
  Mark: (p: { size?: number }) => React.ReactElement;
}) {
  return (
    <div className="flex items-end gap-5">
      {SIZES.map((s) => (
        <div key={s} className="flex flex-col items-center gap-1.5">
          <Mark size={s} />
          <span className="text-[11px] text-muted-foreground">{s}px</span>
        </div>
      ))}
    </div>
  );
}

/** The same mark on cream and on ink — both surfaces it has to survive. */
function BothThemes({
  Mark,
}: {
  Mark: (p: { size?: number }) => React.ReactElement;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-background p-5">
        <SizeRow Mark={Mark} />
      </div>
      <div className="dark rounded-xl border border-border bg-background p-5 text-foreground">
        <SizeRow Mark={Mark} />
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
        Candidates only. The live mark is unchanged everywhere — header,
        favicon, OG image, deck and docs all still use the K-check below.
        Adopting one of these is a separate, deliberate change.
      </p>

      <section className="mt-14">
        <h2 className="text-h3 font-semibold">Current — K-check</h2>
        <p className="mt-2 max-w-2xl text-small text-muted-foreground">
          Geometric K whose lower leg resolves into a checkmark. The tick is the
          thing under review: it reads as &ldquo;approved&rdquo;, which is a
          claim the product deliberately never makes.
        </p>
        <div className="mt-5">
          <BothThemes Mark={LogoMark} />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <LogoMark size={22} />
          <LogoWordmark />
        </div>
      </section>

      {LOGO_CANDIDATES.map(({ key, name, Mark, note }) => (
        <section key={key} className="mt-14 border-t border-border pt-10">
          <h2 className="text-h3 font-semibold">
            {key} — {name}
          </h2>
          <p className="mt-2 max-w-2xl text-small text-muted-foreground">
            {note}
          </p>
          <div className="mt-5">
            <BothThemes Mark={Mark} />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Mark size={22} />
            <LogoWordmark />
          </div>
        </section>
      ))}
    </main>
  );
}
