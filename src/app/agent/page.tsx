import type { Metadata } from "next";
import Link from "next/link";
import { AgentConsole, type CaseCard } from "@/components/agentic/agent-console";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { SPECIMEN_CASES, specimenUrl } from "@/lib/agentic/specimens";
import { recentRuns } from "@/lib/agentic/store/firestore";

export const metadata: Metadata = {
  title: "Run the agents",
  description:
    "Watch Kredal's agent team read a company's documents, check them against each other, decide what it is sure of, ask about what it is not, and heal its own failures — on Gemini and Google Cloud.",
};

// Reads Firestore at request time; must never be prerendered at build, where
// there are no credentials.
export const dynamic = "force-dynamic";

const AGENTS: [string, string][] = [
  ["Intake", "What is each file?"],
  ["Extractor", "Every field, with a confidence and the exact quote"],
  ["Verifier", "Do the documents agree with each other?"],
  ["Fraud Sentinel", "Has anything been altered?"],
  ["Judge", "Act, or ask a person — decided by probability"],
  ["Advisor", "The fix plan and the bank pack"],
  ["Healer", "Detects failures and repairs them"],
  ["Learner", "Learns how far to trust each model"],
];

async function safeRecentRuns() {
  try {
    return (await recentRuns(8)) as { id: string; caseTitle?: string; status?: string; startedAt?: string; chaos?: boolean; heals?: number; result?: { range?: { low: number; high: number } } }[];
  } catch {
    return [];
  }
}

export default async function AgentPage() {
  const cases: CaseCard[] = SPECIMEN_CASES.map((c) => ({
    id: c.id,
    title: c.title,
    summary: c.summary,
    expect: c.expect,
    documents: c.documents.map((d) => ({ id: d.id, type: d.type, file: d.file, url: specimenUrl(c.id, d.file) })),
  }));
  // A run whose request died (a redeploy, a dropped instance) never writes its
  // final status. Past the Cloud Run request timeout it cannot still be going.
  const STALE_MS = 6 * 60 * 1000;
  const runs = (await safeRecentRuns()).map((r) =>
    r.status === "running" && r.startedAt && Date.now() - new Date(r.startedAt).getTime() > STALE_MS
      ? { ...r, status: "interrupted" }
      : r
  );

  return (
    <div className="flex flex-1 flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20">
        <div className="border-b border-border pb-10 pt-16">
          <p className="eyebrow">Agentic Kredal · Gemini on Google Cloud</p>
          <h1 className="mt-3 max-w-3xl text-display font-medium">
            Watch eight agents prepare a company for its bank.
          </h1>
          <p className="mt-4 max-w-2xl text-body text-muted-foreground">
            They read every document, check each against the others, act on what they are sure of and ask a person about
            what they are not — with every decision carrying a probability and its evidence. When something fails, they
            repair it in front of you.
          </p>
          <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
            {AGENTS.map(([name, what]) => (
              <li key={name} className="text-body-sm">
                <span className="font-medium">{name}</span>
                <span className="block text-caption text-muted-foreground">{what}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-10">
          <AgentConsole cases={cases} />
        </div>

        {runs.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <p className="eyebrow">Recent runs</p>
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
              {runs.map((r) => (
                <li key={r.id}>
                  <Link href={`/agent/runs/${r.id}`} className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3 text-body-sm hover:bg-muted">
                    <span className="font-medium">{r.caseTitle}</span>
                    <span className="text-caption text-muted-foreground">
                      {r.status === "done" && r.result?.range
                        ? r.result.range.low === r.result.range.high
                          ? `${r.result.range.low}/100`
                          : `${r.result.range.low}–${r.result.range.high}/100`
                        : r.status}
                      {r.chaos ? " · injected failure" : ""}
                      {r.heals ? ` · ${r.heals} heal${r.heals === 1 ? "" : "s"}` : ""}
                      {r.startedAt ? ` · ${new Date(r.startedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
