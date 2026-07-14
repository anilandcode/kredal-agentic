import Link from "next/link";
import { FileCheck, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KredalLogo } from "@/components/kredal/kredal-logo";
import { SecurityStrip } from "@/components/kredal/security-strip";
import { KREDAL_DISCLAIMER } from "@/lib/constants";

const STEPS = [
  {
    icon: FileCheck,
    title: "Upload your documents",
    body: "Trade license, MOA/AOA, UBO declaration, passports, and more — organized against a bank-specific checklist.",
  },
  {
    icon: ShieldAlert,
    title: "See your rejection risk",
    body: "A readiness score and the exact flags a bank would raise, in plain language, with a fix for each one.",
  },
  {
    icon: Sparkles,
    title: "Generate a bank-ready pack",
    body: "A document-prepared, disclosed, exportable application pack — ready before you walk into the bank.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <KredalLogo />
        <nav className="flex items-center gap-3">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/pricing">Pricing</Link>
          </Button>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/security">Security</Link>
          </Button>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <a
              href="https://docs-site-henna-eight.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-display font-semibold tracking-tight text-balance">
            Stop guessing why UAE banks reject your business account.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground text-balance">
            Upload your documents, get a rejection-risk score, and receive a
            bank-ready application pack before you apply.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">Start your readiness check</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border bg-muted/40 px-6 py-20">
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
                  <step.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-h3 font-semibold">{step.title}</h3>
                <p className="text-body-sm text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <p className="text-body-sm text-muted-foreground">
            {KREDAL_DISCLAIMER}
          </p>
        </section>
      </main>

      <footer className="flex flex-col items-center gap-3 border-t border-border px-6 py-8">
        <SecurityStrip />
        <nav className="flex items-center gap-4 text-caption text-muted-foreground">
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/security" className="hover:text-foreground">Security</Link>
          <a
            href="https://docs-site-henna-eight.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            Docs
          </a>
        </nav>
        <p className="text-caption text-muted-foreground">
          &copy; {new Date().getFullYear()} Kredal. UAE SME bank-readiness
          platform.
        </p>
      </footer>
    </div>
  );
}
