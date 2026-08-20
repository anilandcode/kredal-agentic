import Link from "next/link";
import { Lock } from "lucide-react";
import { DOCS_URL } from "@/components/marketing/site-nav";
import { KREDAL_DISCLAIMER } from "@/lib/constants";

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Security", href: "/security" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: DOCS_URL, external: true },
      { label: "Style guide", href: "/styleguide" },
      { label: "Get started", href: "/signup" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Why Kredal", href: `${DOCS_URL}/docs/explanation/why-kredal`, external: true },
      { label: "Contact", href: "mailto:hello@getkredal.com" },
    ],
  },
];

/** Cursor-style big ink footer with oversized wordmark (design.md §4). */
export function SiteFooter() {
  return (
    <footer className="dark overflow-hidden bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 pt-20">
        <div className="grid gap-10 pb-16 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        className="text-body-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-body-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border py-8">
          <p className="mb-3 flex items-center gap-1.5 text-caption text-muted-foreground">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
            Documents encrypted at rest · Private storage · You control deletion.
          </p>
          <p className="max-w-3xl text-caption text-muted-foreground">
            {KREDAL_DISCLAIMER}
          </p>
          <p className="mt-3 text-caption text-muted-foreground">
            &copy; {new Date().getFullYear()} Kredal. UAE SME bank-readiness platform.
          </p>
        </div>

        {/* Oversized wordmark */}
        <div
          aria-hidden="true"
          className="pointer-events-none -mb-8 select-none text-center font-semibold leading-none tracking-[-0.04em] text-foreground/10"
          style={{ fontSize: "clamp(6rem, 22vw, 18rem)" }}
        >
          Kredal
        </div>
      </div>
    </footer>
  );
}
