import { StatTile } from "@/components/kredal/stat-tile";
import { getAiOpsStats } from "@/lib/admin/data";

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Uploaded",
  parsed: "Parsed",
  needs_review: "Needs review",
  accepted: "Accepted",
  rejected: "Rejected",
};

export default async function AdminAiPage() {
  const stats = await getAiOpsStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 font-semibold">AI &amp; docs ops</h1>
        <p className="text-body-sm text-muted-foreground">
          Gemini extraction pipeline and docs-RAG health.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-h3 font-semibold">Document extraction (last 30 days)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Extractions succeeded" value={stats.extracted30d} />
          <StatTile label="Extractions failed" value={stats.failed30d} />
          <StatTile label="Awaiting human review" value={stats.extractionFailures} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-h3 font-semibold">Documents by status</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Object.entries(stats.documentsByStatus).map(([status, count]) => (
            <StatTile
              key={status}
              label={STATUS_LABELS[status] ?? status}
              value={count}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-h3 font-semibold">Docs RAG (pgvector)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Indexed chunks" value={stats.ragChunks} />
          <StatTile label="Pending embeddings" value={stats.ragPendingEmbeds} />
          <StatTile
            label="Last ingest"
            value={
              stats.ragLastIngest
                ? new Date(stats.ragLastIngest).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Never"
            }
          />
        </div>
        <p className="text-body-sm text-muted-foreground">
          Chunks are embedded by the <code className="rounded bg-muted px-1.5 py-0.5 text-caption">embed-docs</code> edge
          function; re-run <code className="rounded bg-muted px-1.5 py-0.5 text-caption">npm run docs:index -- --remote</code> after
          docs changes.
        </p>
      </section>
    </div>
  );
}
