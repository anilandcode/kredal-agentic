import Link from "next/link";
import { KredalLogo } from "@/components/kredal/kredal-logo";
import { SecurityStrip } from "@/components/kredal/security-strip";
import { Button } from "@/components/ui/button";
import { KREDAL_DISCLAIMER } from "@/lib/constants";

const PLANS = [
  {
    name: "Readiness diagnostic",
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
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/">
          <KredalLogo />
        </Link>
        <nav className="flex items-center gap-4 text-body-sm">
          <Link href="/security" className="text-muted-foreground hover:text-foreground">
            Security
          </Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-display font-semibold">Simple, pilot-phase pricing</h1>
          <p className="mt-4 text-body text-muted-foreground">
            We&apos;re actively validating pricing during our pilot phase — these are
            introductory rates for early UAE SMEs and consultants.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-6 ${
                plan.highlighted ? "border-primary shadow-sm" : "border-border"
              }`}
            >
              <h2 className="text-h3 font-semibold">{plan.name}</h2>
              <p className="mt-3">
                <span className="text-h1 font-semibold tabular-nums">{plan.price}</span>{" "}
                <span className="text-body-sm text-muted-foreground">{plan.period}</span>
              </p>
              <p className="mt-2 text-body-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-body-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={plan.highlighted ? "default" : "outline"}>
                <Link href="/signup">Get started</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-body-sm text-muted-foreground">
          {KREDAL_DISCLAIMER}
        </p>
      </main>

      <footer className="flex flex-col items-center gap-3 border-t border-border px-6 py-8">
        <SecurityStrip />
      </footer>
    </div>
  );
}
