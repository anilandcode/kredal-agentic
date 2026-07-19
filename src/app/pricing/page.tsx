import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { paymentLink, type PaidPlanKey } from "@/lib/payments";

const PLANS: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  linkKey: PaidPlanKey;
  highlighted?: boolean;
}[] = [
  {
    name: "Readiness diagnostic",
    linkKey: "diagnostic",
    price: "AED 499",
    period: "one-time",
    description: "Know exactly why a bank might reject your file, before you apply.",
    features: [
      "Full document checklist review",
      "Rejection-risk score with category breakdown",
      "Every risk flag with an exact fix",
      "Founder readiness report (Markdown export)",
    ],
  },
  {
    name: "Bank application pack",
    linkKey: "pack",
    price: "AED 1,999",
    period: "one-time",
    description: "A document-prepared pack ready to bring to the bank.",
    features: [
      "Everything in the Readiness diagnostic",
      "Bank-matched document checklist",
      "Source-of-funds & business activity narrative drafts",
      "UBO summary and target-bank prep checklist",
    ],
    highlighted: true,
  },
  {
    name: "Consultant workspace",
    linkKey: "consultant",
    price: "AED 499",
    period: "/month",
    description: "For accountants and business setup consultants managing multiple clients.",
    features: [
      "Up to 10 client companies",
      "Client-level readiness dashboard",
      "Role-based access (viewer/member/admin)",
      "White-label reports",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteNav />
      <main className="flex-1 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Pricing</p>
          <h1 className="mt-3 text-display font-medium">
            Simple, pilot-phase pricing
          </h1>
          <p className="mt-4 text-body text-muted-foreground">
            We&apos;re actively validating pricing during our pilot phase —
            these are introductory rates for early UAE SMEs and consultants.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.highlighted
                  ? "border-foreground bg-card-warm"
                  : "border-border bg-muted"
              }`}
            >
              <h2 className="text-h3 font-semibold">{plan.name}</h2>
              <p className="mt-3">
                <span className="text-h1 font-bold tabular-nums">{plan.price}</span>{" "}
                <span className="text-body-sm text-muted-foreground">{plan.period}</span>
              </p>
              <p className="mt-2 text-body-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-body-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-risk-low">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {(() => {
                const link = paymentLink(plan.linkKey);
                return (
                  <Button
                    asChild
                    className="mt-6 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {link ? (
                      <a href={link}>Buy now</a>
                    ) : (
                      <Link href="/signup">Get started</Link>
                    )}
                  </Button>
                );
              })()}
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
