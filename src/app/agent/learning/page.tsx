import type { Metadata } from "next";
import Link from "next/link";
import { ReliabilityChart } from "@/components/agentic/reliability-chart";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { allCalibrators } from "@/lib/agentic/learning/calibrators";
import { firestore, recentRuns } from "@/lib/agentic/store/firestore";

export const metadata: Metadata = {
  title: "What the agents have learned",
  description: "How far Kredal trusts each Gemini model, per skill, learned from verified outcomes.",
};
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  field_read: "Reading a field",
  name_match: "Matching names across documents",
  screening_match: "Screening against the watchlist",
  tamper_visual: "Spotting an edited document",
  integrity: "Overall integrity",
};

const pct = (p: number, digits = 0) => `${(p * 100).toFixed(digits)}%`;

async function load() {
  try {
    const [calibrators, runs, reviews] = await Promise.all([
      allCalibrators(),
      recentRuns(30),
      firestore().collection("reviews").orderBy("at", "desc").limit(8).get(),
    ]);
    return {
      calibrators: calibrators.sort((a, b) => b.observations - a.observations),
      runs: runs as { id: string; caseTitle?: string; startedAt?: string; result?: { accuracy?: { correct: number; total: number } } }[],
      reviews: reviews.docs.map((d) => d.data() as { question: string; answer: boolean; correct: boolean; model: string; kind: string; rawProbability: number; at: string }),
    };
  } catch {
    return { calibrators: [], runs: [], reviews: [] };
  }
}

export default async function LearningPage() {
  const { calibrators, runs, reviews } = await load();
  const outcomes = calibrators.reduce((s, c) => s + c.observations, 0);
  const measured = runs.filter((r) => r.result?.accuracy);
  const fields = measured.reduce((s, r) => s + (r.result!.accuracy!.total ?? 0), 0);
  const right = measured.reduce((s, r) => s + (r.result!.accuracy!.correct ?? 0), 0);

  return (
    <div className="flex flex-1 flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20">
        <div className="border-b border-border pb-10 pt-14">
          <Link href="/agent" className="text-caption underline underline-offset-2">
            ← Run the agents
          </Link>
          <p className="eyebrow mt-6">The Learner</p>
          <h1 className="mt-2 max-w-3xl text-display font-medium">How far each model has earned our trust.</h1>
          <p className="mt-4 max-w-2xl text-body text-muted-foreground">
            A model that says it is 99% sure is not right 99% of the time. Every verified outcome — a person answering a
            question, or a specimen&apos;s known ground truth — is recorded against the confidence the model claimed. The
            engine then routes on what the record shows, not on what the model says. No model is retrained; what changes is
            how much each one is believed, per skill.
          </p>
          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-caption text-muted-foreground">Verified outcomes learned from</dt>
              <dd className="text-h1 font-semibold">{outcomes}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Field accuracy against ground truth</dt>
              <dd className="text-h1 font-semibold">{fields ? pct(right / fields, 1) : "—"}</dd>
              <dd className="text-caption text-muted-foreground">
                {right}/{fields} fields across {measured.length} specimen runs
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Questions answered by people</dt>
              <dd className="text-h1 font-semibold">{reviews.length}</dd>
            </div>
          </dl>
        </div>

        <section className="pt-10">
          <p className="eyebrow">Calibration, per model and skill</p>
          {calibrators.length === 0 ? (
            <p className="mt-4 text-body-sm text-muted-foreground">Nothing learned yet — run a specimen case to start.</p>
          ) : (
            <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {calibrators.map((c) => (
                <div key={c.key} className="rounded-lg border border-border bg-card p-5">
                  <p className="text-body-sm font-semibold">{KIND_LABEL[c.kind] ?? c.kind}</p>
                  <p className="font-mono text-caption text-muted-foreground">{c.model}</p>
                  <div className="mt-3">
                    <ReliabilityChart bins={c.bins} curve={c.curve} anchors={c.anchors} />
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-caption">
                    <div>
                      <dt className="text-muted-foreground">Checked</dt>
                      <dd className="font-mono">{c.observations}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Calibration error</dt>
                      <dd className="font-mono">{pct(c.ece, 1)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">A 99% claim is worth</dt>
                      <dd className="font-mono">{pct(c.at99, 1)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-caption text-muted-foreground">
            Dashed: perfect calibration. Dots: verified outcomes per confidence band, sized by count. Orange: the learned
            curve the engine routes on.
          </p>
        </section>

        {reviews.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <p className="eyebrow">Latest answers from people</p>
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
              {reviews.map((r) => (
                <li key={r.at + r.question} className="px-4 py-3 text-body-sm">
                  <span className="font-medium">{r.correct ? "Confirmed" : "Overturned"}</span>{" "}
                  <span className="text-muted-foreground">
                    · {r.model} claimed {pct(r.rawProbability)} · {KIND_LABEL[r.kind] ?? r.kind}
                  </span>
                  <span className="block">{r.question} — answered {r.answer ? "yes" : "no"}.</span>
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
