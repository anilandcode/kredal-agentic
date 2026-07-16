import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KredalLogo } from "@/components/kredal/kredal-logo";

export const DOCS_URL = "https://docs-site-henna-eight.vercel.app";

/** Marketing nav — 52px, solid background, pill CTA (design.md §4). */
export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[52px] max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="Kredal home">
          <KredalLogo />
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/#features">Features</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/pricing">Pricing</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/security">Security</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
              Docs
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
