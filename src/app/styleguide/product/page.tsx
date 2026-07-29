import type { Metadata } from "next";
import {
  AssessmentFrame,
  BankMatchFrame,
  ConsultantFrame,
  DocumentsFrame,
  PackPreviewFrame,
} from "@/components/marketing/product-frames";
import { DEMO_ASSESSMENT } from "@/lib/marketing/demo-fixture";

export const metadata: Metadata = {
  title: "Product surfaces — Kredal styleguide",
  robots: { index: false, follow: false },
};

const SURFACES = [
  ["Assessment", <AssessmentFrame key="a" />],
  ["Documents", <DocumentsFrame key="d" />],
  ["Bank match", <BankMatchFrame key="b" />],
  ["Application pack", <PackPreviewFrame key="p" />],
  ["Portfolio", <ConsultantFrame key="c" />],
] as const;

export default function ProductSurfacesPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="eyebrow">Styleguide</p>
      <h1 className="mt-3 text-h1 font-semibold">Product surfaces</h1>
      <p className="mt-4 max-w-2xl text-body text-muted-foreground">
        The same frames the landing page uses, at full width. These render the
        real dashboard components against the demo fixture — the score below is
        computed by the shipping scoring engine, not written by hand.
      </p>
      <p className="mt-3 text-small text-muted-foreground">
        Demo company scores{" "}
        <strong className="tabular-nums text-foreground">
          {DEMO_ASSESSMENT.overall_score}/100
        </strong>{" "}
        ({DEMO_ASSESSMENT.risk_level} risk) with{" "}
        {DEMO_ASSESSMENT.flags.length} flags.
      </p>

      {SURFACES.map(([name, node]) => (
        <section key={name} className="mt-14 border-t border-border pt-10">
          <h2 className="mb-5 text-h3 font-semibold">{name}</h2>
          {node}
        </section>
      ))}
    </main>
  );
}
